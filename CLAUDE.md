# CLAUDE.md

Guidance for working in the Cortex repository.

## Project

Cortex is a real-time, multiplayer quiz app built around a user’s study notes. A host can select an existing quiz or upload a PDF/text source to generate one with Gemini, then invite players to a timed Socket.io game.

The repository contains two independent Node projects; there is no root workspace configuration:

- `frontend/` — React 19, TypeScript, Vite, React Router, Tailwind CSS, Zustand, Clerk, and Socket.io client.
- `backend/` — Express 5, Socket.io, Prisma 7/Postgres, Redis/ioredis, BullMQ, Clerk, Zod, Multer, and the Vercel AI SDK with Gemini.

## Commands

Run commands from the relevant project directory.

### Frontend

```bash
cd frontend
npm run dev       # Vite on port 5173; binds to all interfaces
npm run build     # Type-check and build production assets
npm run lint      # ESLint
npm run preview   # Preview the production build
```

### Backend

```bash
cd backend
npm run dev                 # tsx watch src/index.ts; port 3000 by default
npm run start               # Run src/index.ts with tsx
npm run build               # Generate the Prisma client
npm test                    # Node test runner over src/**/*.test.ts
npm run seed                # Seed legacy country data
npm run seed:quiz           # Seed a sample quiz
npm run smoke:quiz-pipeline # Exercise the generation pipeline
npx prisma migrate dev      # Create/apply local migrations
npx prisma studio           # Inspect Postgres data
```

`docker compose up --build` starts the backend, frontend, and Redis. Postgres is deliberately external to the compose stack and must be supplied via `backend/.env`.

## Configuration

Backend environment variables:

- Required: `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and `GEMINI_API_KEY` for generation.
- Common: `PORT` (defaults to `3000`), `CLIENT_ORIGIN`, and `NODE_ENV`.
- Generation tuning: `GEMINI_MODEL`, `QUIZ_BATCH_TOKEN_BUDGET`, `MAX_GEN_RETRIES`, `QUIZ_GEN_CONCURRENCY`, `MAX_QUESTIONS`, and `MAX_SYNC_LLM_CALLS`.

Frontend environment variables:

- Required: `VITE_CLERK_PUBLISHABLE_KEY`.
- Optional: `VITE_API_URL`, which defaults to `http://localhost:3000`.

The backend’s CORS allow-list comes from `CLIENT_ORIGIN`; keep it aligned with the deployed frontend URL. Never commit `.env` files, credentials, Clerk tokens, or Gemini keys.

## Application shape

### HTTP API

All application routes require Clerk authentication except `POST /api/webhooks/clerk`, which uses the raw request body for Svix verification and must remain mounted before `express.json()`.

- `POST /api/games/waiting/` creates a Redis-backed waiting room.
- `GET /api/games/waiting/public` lists public waiting rooms.
- `POST /api/games/waiting/:gameId/generate` uploads a source and starts background generation for that room.
- `POST /api/games/waiting/:gameId/quiz/fail` marks a waiting-room generation as failed.
- `POST /api/quiz/generate` creates a standalone generated quiz; small jobs can complete synchronously and larger jobs return a job ID.
- `GET /api/quiz/jobs/:jobId` polls a generation job.
- `GET /api/quizzes` and `GET /api/quizzes/:quizId` expose the caller’s ready quizzes.
- `/api/users` is authenticated and mounted in `src/index.ts`.

Multer keeps uploaded files in memory and limits them to 10 MB. Preserve both constraints unless the upload pipeline is deliberately redesigned.

### Authentication and identity boundary

Clerk is the identity provider. The Clerk `user.created` webhook provisions the corresponding Postgres `users` row. REST authentication attaches the Clerk ID as `req.userId`; Socket.io authentication verifies the handshake token, then resolves and stores both `socket.data.clerkUserId` and the internal `socket.data.userId`.

Use the Postgres `users.id` in games, Redis room state, and Prisma relations. Do not write Clerk IDs into those fields. The webhook means a just-created Clerk user can briefly lack a local row; preserve clear 404/auth handling around that race.

### Data ownership

Postgres is the durable source of truth for users, generated quizzes/questions, and game records. The Prisma client is generated into `backend/app/generated/prisma`.

Redis holds ephemeral waiting-room and active-game state, public-room indexes, round/submission keys, and BullMQ data. Waiting rooms have a one-hour TTL. Treat Redis as live state, never as a replacement for durable history.

BullMQ uses the same Redis connection for quiz-generation workers and delayed round-end jobs. Workers are started from `src/index.ts`; do not introduce a separate worker process without preventing duplicate consumers.

### Quiz generation

The pipeline under `backend/src/services/quiz/` extracts readable PDF/text content, chunks it, plans batches, asks Gemini to generate questions, validates/cleans them with Zod, and persists valid quizzes and questions. It can run synchronously or queue async work based on the planned LLM-call count.

When changing this path, keep owner scoping, job-status transitions, bounded concurrency/retries, and validation intact. Never expose correct answers or explanations in a live `new_question` socket payload; use `publicNewQuestionFromRound`.

### Multiplayer lifecycle

1. A host creates a Redis waiting room, optionally with an existing ready quiz. If no quiz is selected, the room begins in `quizGenStatus: processing` and can receive an uploaded source.
2. Players authenticate with Socket.io and use `join_game`, `player_ready`, and `leave_game`. Lobby mutations use Lua scripts to make joins/readiness/leaves atomic. A departing host is promoted to the first remaining player.
3. `start_game` requires at least two ready players and a ready quiz. It creates a Postgres `Game` row using the Redis game UUID, then flips the Redis state to `playing`; it rolls back the database row if that flip fails.
4. A three-second countdown precedes the first question. Rounds run for 30 seconds and are ended by a BullMQ delayed job, or early when every player submits.
5. Answer submission is guarded by Lua: one answer per player/round, server-side correctness, and atomic correct-placement counting. Scores are applied to Redis and the server broadcasts round and final leaderboards.

Current limitation: `endGame` broadcasts the final result and marks Redis state finished, but does **not** yet persist completion data (`GamePlayer`, `Answer`, final game status/winner, or ratings) to Postgres. Do not claim finished-game persistence or ELO behavior exists until it is implemented transactionally.

## Code conventions and invariants

- Backend is ESM with NodeNext-style imports. Every relative TypeScript import must use a `.js` extension.
- Backend files use role suffixes such as `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.middleware.ts`; keep domain logic in `src/services/` and request/socket validation in schemas and handlers.
- Validate HTTP bodies/params through the existing Zod middleware and validate Socket.io payloads with `parseSocketPayload` before using them.
- Keep question selection and correctness server-side. Browser clients receive only the public question fields during a round.
- Preserve Redis atomicity for concurrent paths. In particular, do not replace lobby Lua scripts or `SUBMIT_ANSWER_LUA` with read-modify-write code.
- Round-end has two contenders (BullMQ timeout and last answer). `ROUND_ENDED_KEY` uses `SET ... NX` to ensure exactly one wins; preserve this guard when changing the flow.
- Socket.io is currently single-instance only. Add the Socket.io Redis adapter before treating multi-instance deployment as supported.
- Be careful with the Redis/Postgres boundary: a game’s ID is shared between both systems after start, but live score and round state remain Redis-owned until durable completion is implemented.

## Frontend organization

Routes live in `frontend/src/App.tsx`: public landing/auth routes and Clerk-protected dashboard, create/join, lobby, and game routes. Feature UI lives under `components/`; server interactions under `lib/` and hooks; Zustand state under `stores/`.

Keep UI state synchronized through the existing socket hooks and stores rather than duplicating game state in individual components. Use the existing `api.ts` base URL handling and Clerk token flow for new backend calls.

## Before handing off a change

- Run the narrowest relevant backend tests for service/schema changes, then `npm test` when practical.
- Run `npm run build` for frontend TypeScript/UI changes and `npm run lint` for frontend code changes.
- Run `npm run build` in `backend/` after changing Prisma schema or generated-client usage; apply migrations intentionally, never by editing generated Prisma output.
- Do not alter unrelated working-tree changes. This repository may contain locally removed visual assets and other in-progress work.
