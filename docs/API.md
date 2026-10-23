# HTTP API contracts

This document describes the HTTP routes mounted by `backend/src/index.ts`, as implemented in the repository. It does not cover Socket.io events. Paths are relative to the backend origin (port 3000 by default). Source files named below are the contract evidence; review them before changing a route.

## Organization and common behavior

`index.ts` mounts the Clerk webhook first, with a raw JSON body. It then installs `express.json()` and Clerk middleware. `/api/users` has `requireAuth` at the mount; `/api/games`, `/api/quiz`, and `/api/quizzes` apply it per route. There is no global HTTP error formatter or explicit 404 handler. Unhandled errors and Multer errors therefore use Express's default error path; do not assume they return the endpoint's JSON error shape. CORS is configured in `backend/src/lib/cors.ts` from `CLIENT_ORIGIN`.

Protected requests use Clerk authentication (the frontend sends `Authorization: Bearer <Clerk token>`). `requireAuth` calls Clerk's `getAuth` and returns `401 { error: "Unauthorized" }` when unauthenticated. For an authenticated identity missing from local Postgres, it fetches that identity's Clerk profile and upserts a local `User` before assigning the Clerk user ID to `req.userId`; provisioning failure returns `503 { error: "Could not prepare user account" }`. This lets an existing Clerk account use a new local database even when its original `user.created` webhook predates that database. Controllers resolve the Clerk ID to the local `User.id` where owner or host checks require it. `GET /api/users/:userId` allows any authenticated caller to read another user's selected profile fields; only `PUT` checks that the path ID equals `req.userId`.

`validateBody` and `validateParams` use Zod `safeParse`, replace the parsed request value (including defaults/transforms), and on failure return `400 { message: "Validation failed", errors: <Zod flattened error> }`. The object schemas do not use strict mode, so extra body fields are stripped on routes using `validateBody`. The two multipart generation routes instead validate `count` and `title` in their controllers and have different error keys. No route implements query-parameter filtering or pagination. No HTTP rate-limit middleware or explicit `429` response is present. Generation has a per-local-user Redis `SET NX` inflight lock with a 15-second TTL; standalone generation maps a lock conflict to `409`, while waiting-room generation starts asynchronously and reports later failure through room status.

Dates serialized from `Date` fields are ISO strings in JSON. IDs in `User` relations, room `hostId`/player `id`, and quiz `ownerId` are local Postgres UUIDs; `userId` in `/api/users/:userId` is a Clerk ID. The game and quiz job IDs are different kinds of UUIDs. Error bodies use `error` on user/standalone-quiz routes and `message` on game routes; clients must not assume one common key.

## Users and Clerk webhook

### `POST /api/webhooks/clerk`

- **Purpose:** Provision, update, or delete a local user from Clerk `user.created`, `user.updated`, and `user.deleted` events. Other verified event types are acknowledged without a database change.
- **Access:** No `requireAuth`. Requires a valid Svix-signed Clerk webhook; `CLERK_WEBHOOK_SECRET` must be set. The raw `application/json` body and signature headers are consumed by Clerk's `verifyWebhook`. The route does not define its own payload schema.
- **Request:** Clerk event object. For `user.created`, code reads `data.id`, `email_addresses`, `primary_email_address_id`, and `username`; it chooses the primary email or first available email. `user.updated` uses the primary email when available and a nonempty username; `user.deleted` reads `data.id`. No path or query parameters.
- **Response/status:** `200 { message: "Webhook received" }` for accepted events, including deletion with no ID. `400 { error: "Invalid SVIX signature" }` on verification failure; `400 { error: "User has no email address" }` on creation without an email. `500 { error: "CLERK_WEBHOOK_SECRET is not set" }`, or `500` with `Error creating user`, `Error updating user`, or `Error deleting user` for the relevant database operation.
- **Implementation:** `backend/src/index.ts`; `backend/src/webhooks/clerk.ts`; `backend/src/lib/prisma.ts`.

### `GET /api/users/:userId`

- **Purpose/access:** Return selected profile fields for a Clerk user ID. Any authenticated user can request any `userId`; this is **not** self-only.
- **Parameters:** Nonempty string `userId` path parameter. No query or body parameters.
- **Response/status:** `200` object with `id` (local UUID), `clerkUserId`, `username`, `rating`, `gamesPlayed`, `wins`, `createdAt`, and `lastActive`. `404 { error: "User not found" }`; `500 { error: "Error fetching user" }`. Authentication and path-validation errors follow the common rules above.
- **Implementation:** `backend/src/routes/user.routes.ts`; `backend/src/controllers/user.controller.ts`; `backend/src/schemas/user.ts` and `common.ts`.

### `PUT /api/users/:userId`

- **Purpose/access:** Change the caller's username. Authenticated caller's Clerk ID must equal the path `userId`; otherwise `403 { error: "Forbidden" }`.
- **Parameters/body:** Nonempty `userId` path string. JSON body `username`: required string of 3–20 ASCII letters, digits, or underscores (`^[a-zA-Z0-9_]{3,20}$`). No query parameters. Other body fields are stripped.
- **Response/status:** `200` object with `id` (local UUID), `username`, `rating`, `gamesPlayed`, `wins`, `createdAt`, and `lastActive` (no `clerkUserId`). `404 { error: "User not found" }` for Prisma `P2025`; `409 { error: "Username already taken" }` for `P2002`; `500 { error: "Error updating user" }` otherwise. Authentication and validation errors follow the common rules.
- **Implementation:** `backend/src/routes/user.routes.ts`; `backend/src/controllers/user.controller.ts`; `backend/src/schemas/user.ts` and `common.ts`.

## Document upload and AI generation

Both upload routes use Multer memory storage and `upload.single("file")`, with a 10 MiB file limit. They accept `multipart/form-data`: a `file` part, `count`, and optional `title`. `count` is coerced to a positive integer by Zod, then checked against `MAX_QUESTIONS` (environment value, default 50) in the pipeline. `title` must be a string of at most 255 characters after trimming; empty or omitted title falls back to the uploaded filename without its extension, trimmed to 255 characters (or `Untitled quiz`). MIME type `application/pdf` or a `.pdf` filename selects PDF parsing. `text/plain`, `text/markdown`, `.txt`, or `.md` selects UTF-8 text. The cleaned document must contain readable text and at least 50 words. Filename and MIME checks are alternatives, so a `.pdf` extension takes precedence. Multer limit/part errors have no custom JSON mapper.

The pipeline stores transient job and work data in Redis with a one-hour TTL, queues BullMQ work, and persists a quiz with its questions in Postgres only after complete generation. Its inflight lock guards request preparation, not the full background generation. The standalone polling endpoint is owner-scoped. Waiting-room generation communicates the later outcome via room state and `quiz_status` Socket.io events; the HTTP `202` only confirms scheduling.

### `POST /api/quiz/generate`

- **Purpose/access:** Start standalone quiz generation. Requires Clerk auth and a provisioned local user.
- **Request:** Multipart `file` (required, at most 10 MiB), `count` (required positive integer after coercion, at most `MAX_QUESTIONS`), optional `title` as above. No path or query parameters.
- **Response/status:** `202` object `{ jobId, status, metadata }`, where `jobId` is a Redis job UUID, `status` is `processing`, and `metadata` has `requestedCount`, `sourceType` (`pdf` or `text`), and `title`. `404 { error: "User not found" }`; `400 { error: "File is required" }`; `400 { error: "Invalid count" | "Invalid title", details: <Zod issues> }`; `400 { error: <message> }` for too-short source, no chunks, or pipeline count outside its range; `422 { error: <message> }` for PDF parse failure, unsupported type, or no readable text; `409 { error: "Quiz generation already in progress" }`; `500 { error: "Internal server error" }` for other caught errors. Common auth and Multer behavior also applies.
- **Implementation:** `backend/src/routes/quiz.routes.ts`; `backend/src/controllers/quiz.controller.ts`; `backend/src/schemas/quiz.ts`; `backend/src/services/quiz/{pipeline,load,persist}.ts`; `backend/src/workers/quizGenerate.worker.ts`.

`POST /api/quiz/generate/solo` accepts the same multipart request and returns the same `202` job envelope, but persists the completed quiz with classification `SOLO_ONLY`. The original endpoint creates `MULTIPLAYER` quizzes. Both use `GET /api/quiz/jobs/:jobId` for owner-scoped status polling.

### `GET /api/quiz/jobs/:jobId`

- **Purpose/access:** Poll a standalone generation job. Requires Clerk auth and a local user; a missing, expired, or other user's job returns the same `404`.
- **Parameters:** UUID `jobId` path parameter. No query or body parameters.
- **Response/status:** `200` job object with `jobId`, local `ownerId`, `title`, `sourceType` (`pdf` or `text`), `requestedCount`, `createdAt`, and `status`. Status `processing` adds no state field; `ready` adds `quizId`; `failed` adds `errorMessage`. `404 { error: "User not found" }` or `{ error: "Job not found" }`; `500 { error: "Internal server error" }`. Common auth and path-validation behavior applies.
- **Implementation:** `backend/src/routes/quiz.routes.ts`; `backend/src/controllers/quiz.controller.ts`; `backend/src/schemas/quiz.ts`; `backend/src/services/quiz/persist.service.ts`.

### `GET /api/quizzes`

- **Purpose/access:** List the authenticated local user's ready multiplayer quizzes that have at least one question, for hosting and dashboard selection. Solo-only quizzes are excluded.
- **Parameters:** No path, query, or body parameters. Results are ordered by `createdAt` descending, with no pagination.
- **Response/status:** `200 { quizzes: [...] }`. Each summary has `id`, `title`, `sourceType`, `questionCount`, and `createdAt`; no questions. `404 { error: "User not found" }`; `500 { error: "Internal server error" }`. Common auth behavior applies.
- **Implementation:** `backend/src/routes/quiz.routes.ts`; `backend/src/controllers/quiz.controller.ts`; `backend/src/services/quiz/persist.service.ts`.

### `GET /api/quizzes/:quizId`

- **Purpose/access:** Fetch quiz details and question previews for the authenticated owner. An absent or other user's quiz returns `404`.
- **Parameters:** UUID `quizId` path parameter. No query or body parameters.
- **Response/status:** `200` object with `id`, `title`, `sourceType`, `status`, `classification`, `questionCount`, `createdAt`, and ordered `questions`. Each question has `id`, `position`, `type`, `question`, and MCQ `options` when applicable; answer keys and explanations are omitted. `404 { error: "User not found" }` or `{ error: "Quiz not found" }`; `500 { error: "Internal server error" }`. Common auth and path-validation behavior applies. This detail endpoint does not filter on quiz `status`, unlike the list endpoint.
- **Implementation:** `backend/src/routes/quiz.routes.ts`; `backend/src/controllers/quiz.controller.ts`; `backend/src/schemas/quiz.ts`; `backend/src/services/quiz/persist.service.ts`; `backend/prisma/schema.prisma`.

### `DELETE /api/quizzes/:quizId`

- **Purpose/access:** Delete an owned quiz after client confirmation. An absent or other user's quiz returns `404`.
- **Parameters:** UUID `quizId` path parameter. No query or body parameters.
- **Response/status:** `204` on deletion; `404 { error: "Quiz not found" }` for a missing or unowned quiz; `409` when an active Redis room or durable game references it. Child questions and source records cascade in Postgres. Common auth and validation behavior applies.

## Quiz and game management

HTTP covers room creation, public waiting-room discovery, and a host's quiz-generation state changes. Joining, readiness, starting, answering, and game progress use Socket.io handlers under `backend/src/socket/`; there are no HTTP endpoints for those actions.

### `GET /api/games/:gameId/review`

- **Purpose/access:** Return a finished match's question review to a persisted participant. Clerk auth is required; the Clerk subject is resolved to a local user UUID, and the query requires a matching `GamePlayer` row and `finished` game. Older games without complete recorded round order are unavailable.
- **Parameters:** UUID `gameId` path parameter; no query or body.
- **Response/status:** `200 { gameId, rounds: [...] }` in played order. Each round has `roundNumber`, `question`, `type`, optional `options` for MCQ, `playerAnswer` (`number`, `boolean`, string, or `null`), `correct` (`boolean` or `null`), `pointsEarned`, `correctAnswer` (display string), `explanation`, and `sources: [{ chunkId, quote }]`. An unanswered round has `playerAnswer: null`, `correct: null`, and `pointsEarned: 0`. Older quizzes can return `sources: []`. Unfinished, nonmember, absent, or older games without order return `404 { message: "Review unavailable" }`; unauthenticated calls return `401`. Path validation follows the common rules.
- **Implementation:** `backend/src/routes/game.routes.ts`; `backend/src/controllers/game.controller.ts`; `backend/src/services/gameReview.service.ts`.

### `POST /api/games/waiting/`

- **Purpose/access:** Create a Redis waiting room with the caller as host. Requires Clerk auth and a provisioned local user. If `quizId` is supplied, it must be the host's ready quiz with at least one question.
- **Body:** JSON object: optional UUID `quizId`; `rounds` integer 1–50 (default 10); `maxPlayers` integer 2–8 (default 8); `isPublic` boolean (default `false`). No path or query parameters. Extra body fields are stripped. With a quiz, `numberOfRounds` is capped at its question count; without one, initial `quizGenStatus` is `processing`.
- **Response/status:** `201` waiting-room object with `gameId` (UUID), `quizId` (UUID or `null`), `quizGenStatus`, `quizGenJobId` (`null` initially), `quizGenError` (`null` initially), `isPublic`, `numberOfRounds`, `maxPlayers`, `players` (initial host `{ id, username, ready: false, score: 0 }`), `status: "waiting"`, `hostId` (local UUID), six-character `roomCode`, and `createdAt`. `404 { message: "Host not found" }` or `{ message: "Quiz not found" }` (also used for another owner's quiz); `400 { message: "Quiz is not ready" }` or `{ message: "Quiz has no questions" }`. Common auth and body-validation behavior applies. Other service errors are thrown to Express.
- **Implementation:** `backend/src/routes/game.routes.ts`; `backend/src/controllers/game.controller.ts`; `backend/src/schemas/game.ts`; `backend/src/services/{game,gamePlay.helpers,publicWaitingFeed}.ts`; `backend/src/types/room.types.ts`.

### `GET /api/games/waiting/public`

- **Purpose/access:** List public rooms still in `waiting` state. Requires Clerk auth; no local-user lookup in this controller.
- **Parameters:** No path, query, or body parameters. All indexed rooms are examined, newest first; stale/private/nonwaiting index entries are pruned. No pagination or filters.
- **Response/status:** `200` array of objects with `gameId`, `roomCode`, `hostId` (local UUID), `hostUsername`, `playerCount`, `maxPlayers`, `numberOfRounds`, `quizGenStatus`, and `createdAt` (ISO string). Common `401` auth response applies. Unhandled Redis/JSON errors pass to Express.
- **Implementation:** `backend/src/routes/game.routes.ts`; `backend/src/controllers/game.controller.ts`; `backend/src/services/publicWaitingFeed.service.ts`; `backend/src/types/room.types.ts`.

### `POST /api/games/waiting/:gameId/generate`

- **Purpose/access:** Schedule document generation for an existing waiting room. Requires Clerk auth, a local user, and that user must be the room host.
- **Parameters/request:** UUID `gameId` path parameter. Multipart `file`, `count`, and optional `title` obey the shared upload rules above. No query parameters.
- **Response/status:** `202 { status: "processing" }`. `404 { message: "User not found" }` or `{ message: "Room not found" }`; `403 { message: "Only the host can generate a quiz" }`; `409 { message: "Game has already started" }`; `400 { message: "File is required" }`; `400 { message: "Invalid count" | "Invalid title", errors: <Zod issues> }`. Common auth/path-validation and Multer behavior applies. The generation work starts in a `setImmediate` callback after the response path; extraction/queue failures update the room to `failed` rather than returning a different HTTP status.
- **Implementation:** `backend/src/routes/game.routes.ts`; `backend/src/controllers/game.controller.ts`; `backend/src/schemas/{game,quiz}.ts`; `backend/src/services/waitingQuiz.service.ts`; `backend/src/services/quiz/{pipeline,load,persist}.ts`; `backend/src/workers/{quizGenerate,waitingRoomQuiz}.worker.ts`.

### `POST /api/games/waiting/:gameId/quiz/fail`

- **Purpose/access:** Have the room host mark waiting-room quiz generation failed, for example after a client-side upload failure. Requires Clerk auth, a local user, and host ownership.
- **Parameters/body:** UUID `gameId` path parameter. JSON `message`: trimmed string, 1–500 characters; if omitted, defaults to `Failed to start quiz generation`. No query parameters. Extra body fields are stripped.
- **Response/status:** `200` payload with `quizId: null`, `quizGenStatus: "failed"`, and `quizGenError` (the message, capped to 500 characters by the service). Also emits `quiz_status` to the room. `404 { message: "User not found" }` or `{ message: "Room not found" }`; `403 { message: "Only the host can update the quiz" }`; `409 { message: "Game has already started" }` or `{ message: "Room is no longer waiting" }`. Common auth/path/body-validation behavior applies. Unhandled storage errors pass to Express.
- **Implementation:** `backend/src/routes/game.routes.ts`; `backend/src/controllers/game.controller.ts`; `backend/src/schemas/game.ts`; `backend/src/services/waitingQuiz.service.ts`.

## Solo practice

All `/api/practice` routes require Clerk authentication. Quiz and session IDs are UUIDs; unauthorized or ineligible quizzes and sessions return 404. Eligibility is quiz ownership or a `GamePlayer` row in a finished game for that quiz. Responses for an unfinished session include ordered public questions, saved answers, and `resumeIndex` (`-1` when all are answered); they omit answer keys, correctness, explanations, and sources.

| Method and path | Behavior |
| --- | --- |
| `GET /api/practice/library` | `{created, played}` ready quiz summaries, each with `classification`, `unfinished` progress, and `latestResult` metadata. Created includes owned solo-only and multiplayer quizzes. |
| `DELETE /api/practice/quizzes/:quizId` | Delete an owned `SOLO_ONLY` quiz and cascading practice/question/source records (204). Missing or unowned returns 404; an owned multiplayer quiz returns 403; a live room or saved game reference returns 409. |
| `POST /api/practice/quizzes/:quizId/sessions` | Return an existing unfinished attempt or start a shuffled complete attempt. |
| `POST /api/practice/quizzes/:quizId/start-fresh` | Replace only the caller's unfinished attempt. |
| `GET /api/practice/sessions/:sessionId` | Read the owned attempt and its ordered questions/answers. |
| `PUT /api/practice/sessions/:sessionId/answers/:questionId` | Save `{selectedIndex: number}` for MCQ, `{answer: boolean}` for true/false, or `{answer: string}` for fill blank. |
| `DELETE /api/practice/sessions/:sessionId/answers/:questionId` | Clear a saved answer; returns 204. |
| `POST /api/practice/sessions/:sessionId/submit` | Finalize all answered questions, optionally with `{pending: {questionId, answer}}`; retries return the saved result. |
| `GET /api/practice/quizzes/:quizId/results/latest` | Return the latest completed result, including correctness, correct answer, and explanation. |

Invalid answer shapes return 400; attempts that cannot be changed or submitted return 409. The backend rechecks access on every route.

## Existing tests, examples, and client compatibility

- `backend/src/schemas/tests/game.test.ts` checks room defaults, accepted quiz/public inputs, and UUID room IDs. `backend/src/services/tests/{game.service,publicWaitingFeed.service,waitingQuiz.service,gamePlay.helpers}.test.ts` cover room creation/indexing, public-room listing, waiting-quiz state, and quiz play gates. `backend/src/services/quiz/tests/{pipeline,storedGeneration,validation.service}.test.ts` and neighboring quiz service tests cover extraction/generation behavior and job transitions. There are no route/controller HTTP contract tests in `backend/src` at the time of this inventory. `backend/scripts/smokeQuizPipeline.ts` exercises the pipeline, not an HTTP route.
- `frontend/src/lib/api.ts` is the main HTTP consumer and supplies request/response TypeScript shapes. `frontend/src/hooks/useCurrentUser.ts` calls `GET /api/users/:userId`. `frontend/src/pages/CreateGame.tsx` creates rooms, starts room generation, and can mark upload failure; the lobby generation panel also calls room generation. Existing browser calls use Clerk tokens, JSON for room/profile requests, and browser-generated multipart boundaries for uploads. Preserve the exact path prefixes, body field names (`file`, `count`, `title`, `quizId`, `rounds`, `maxPlayers`, `isPublic`, `message`), response wrapper `{ quizzes }`, room and job status strings, ID meanings, and existing error/status distinctions when changing endpoints.
- **Manual review:** `POST /api/quiz/generate` returns only a processing job envelope; `GET /api/quiz/jobs/:jobId` returns `quizId` only when ready. The public waiting-room list is available to any Clerk-authenticated identity while other room operations require a local user, and quiz detail lookup does not apply the list endpoint's ready/positive-question filter.
