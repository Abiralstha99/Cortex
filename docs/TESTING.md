# Testing Cortex

This is an inventory of tests and commands present in the repository, not a claim that every suite passes in every environment. Run commands from `backend/` or `frontend/`; there is no root npm workspace. Check `README.md` and `CLAUDE.md` for product and architecture context before changing a code path.

## Testing philosophy

| Level | What it should establish here | Current implementation |
| --- | --- | --- |
| Pure unit | Schema rejection, quiz text/LLM planning, scoring/ranking, public payload shape, and recovery state decisions. | Node `node:test` and Vitest suites exercise these with fixed inputs. |
| Service/component | Redis state transitions, generation job ordering, queue retry decisions, and UI behavior at the page/hook/component boundary. | Some backend tests use real Redis; other dependencies are injected fakes. Frontend tests use jsdom and mocked hooks/services. |
| Integration | Correct boundaries among HTTP/Clerk, Socket.io, BullMQ, Redis, and Postgres, especially atomicity and durable completion. | Only selected Redis service and directly invoked socket-handler tests exist. There is no full-stack integration harness or test Postgres provisioner. |
| End to end | A real authenticated host and players create/generate a quiz, play, reconnect, and inspect durable results in a browser. | No browser E2E runner or E2E tests are present. |

Use a narrow suite while editing, then the relevant package suite and static checks. A test file's existence does not prove its execution or prove behavior outside its assertions.

## Structure and frameworks

- `backend/src/schemas/tests/*.test.ts` and `backend/src/services/{tests,quiz/tests}/*.test.ts`: 25 test files using Node's built-in `node:test`, `node:assert/strict`, and `tsx` for TypeScript. The backend package script discovers every `src/**/*.test.ts` file with `find`. There is no separate runner config.
- `frontend/src/**/*.test.{ts,tsx}`: 29 colocated files using Vitest, React Testing Library, `user-event`, and jsdom. `frontend/vite.config.ts` enables jsdom, CSS, and `frontend/src/test/setup.ts` (`@testing-library/jest-dom/vitest`). `@` resolves to `frontend/src`.
- `frontend/public/fixtures/sample-notes.txt` is a public sample asset; the automated suites do not use it as a shared test fixture. Tests mostly define their own data locally. There is no shared backend test setup module.
- No Playwright/Cypress configuration or browser E2E suite was found. No coverage provider, coverage script, coverage threshold, or committed report was found.

## Commands from package scripts

| Directory | Command | Purpose and constraints |
| --- | --- | --- |
| `backend/` | `npm test` | Runs `node --import tsx --test $(find src -name '*.test.ts')`. Includes tests that read/write live Redis. Use only with a dedicated disposable `REDIS_URL`; do not point it at production or shared data. |
| `backend/` | `node --import tsx --test src/services/quiz/tests/validation.service.test.ts` | Example narrow Node test invocation using the same runner. Check imports before treating another file as infrastructure-free. |
| `backend/` | `npm run build` | Generates the Prisma client; it is not a TypeScript compile or a test. |
| `frontend/` | `npm test` | Runs `vitest run` once. |
| `frontend/` | `npm run test:watch` | Runs interactive Vitest watch mode. |
| `frontend/` | `npm run lint` | ESLint over the frontend. |
| `frontend/` | `npm run build` | `tsc -b && vite build`; validates types and produces assets. |

The backend package also declares `smoke:pick-question` and `smoke:quiz-pipeline`, but their referenced `backend/scripts/*.ts` files are absent in this checkout. Do not use them as verification evidence. There is no backend lint or TypeScript typecheck script.

## Test inventory and feature map

| Feature / boundary | Tests and actual assertions | Limit |
| --- | --- | --- |
| Quiz generation | `backend/src/services/quiz/tests/*.test.ts` includes cleaning, chunk/batch budgets, validation, duplicate handling, retry planning, and model config. `pipeline.test.ts` uses a fake model completion provider to check requested count, duplicate replacement, usage metrics, and incomplete-generation failure. `storedGeneration.test.ts` injects generation/persistence/job dependencies to check ready/fail ordering and retry after persistence. Frontend `upload-validation.test.ts` and `CreateStage.test.tsx` check file validation UI. | No live PDF-to-Gemini-to-Postgres run; real Gemini, PDF extraction edge cases, API upload, and worker execution are not established by these tests. |
| Room creation and public discovery | Backend `schemas/tests/game.test.ts` validates create/ID inputs; `services/tests/{game,publicWaitingFeed}.service.test.ts` tests Redis creation/indexing, public-only feed, ordering, stale pruning, and retraction. `waitingQuiz.{helpers,service}.test.ts` checks generation status and refusal to attach/update after a room starts/disappears. Frontend `JoinRoomPanel`, `JoinRail`, `LiveRoomCard`, `LiveRoomRows`, and `QuizRows` tests check entry, presentation, and selected signed-in/empty states. | No HTTP route/auth test for create, list, upload, or join. Some backend cases require live Redis. |
| Lobby and multiplayer | `lobby.service.test.ts` checks the last player's leave result for public/private rooms. `gameStartLock.service.test.ts` checks concurrent start claims. `quizCache.service.test.ts` checks cache reuse, TTL, and pinned-version rejection. `roundCache.service.test.ts` checks independent game orders, duplicate advancement, and repeat-score protection against live Redis. `answer.types.test.ts` checks all answer types, duplicate/concurrent submissions, atomic scored records, and rejection after a round-end claim. `roundReveal.service.test.ts` races both end-round callers against Redis and checks one broadcast plus delayed finish. `gamePlay.helpers.test.ts` checks quiz ownership/readiness and answer-free public question payload. `answer.points.test.ts` checks point mapping and server-time calculations. Frontend `Lobby.test.tsx`, `PlayerCard.test.tsx`, and `QuestionCard.test.tsx` check selected rendering, answer locking, and inline private feedback. | No test drives two real clients through join/ready/start or a complete game. |
| Reconnection and recovery | `gameResume.helpers.test.ts` checks membership, temporary gaps, answer secrecy, feedback, and phase snapshots. `gameResume.service.test.ts` uses Redis and directly invokes registered `resume_game`/`submit_answer` handlers for membership, private acknowledgement, and snapshot behavior. Frontend `useSocket.test.tsx`, `useGameSocket.test.tsx`, `Game.test.tsx`, and `ConnectionBanner.test.tsx` test mocked socket lifecycle, pending/accepted/rejected/timed-out submissions, snapshot hydration, newer-event replay, missed-broadcast recovery, retry, and UI messages. | No real network interruption with two Socket.io clients or server restart. |
| Completion and persistence | `gameCompletion.helpers.test.ts` checks previous/final tie ranks, winner payloads, and answer/player record mapping. `gameCompletion.persistence.test.ts` uses a fake transaction recorder to check write order and that a failed answer write does not reach the finished update. `gameFinish.queue.test.ts` checks delayed finalization and failed-job retry/deduplication. Frontend `RoundResults.test.tsx` and `GameResults.test.tsx` check animated rank movement, reduced motion, late reveal recovery, timeout display, and tied winners. | No test uses a real Postgres transaction, verifies rollback/constraints, or proves recovery after a crash between Redis and Postgres. |
| Authentication/identity | Frontend `AuthLayout.test.tsx` checks auth page structure; several page/hook tests stub Clerk state or tokens. Backend `middleware/requireAuth.middleware.test.ts` checks missing-local-user provisioning and refusal to create a row without an email. Backend recovery tests use synthetic `socket.data.userId` to check member authorization. | No Clerk JWT verification, HTTP middleware integration, webhook signature/provisioning, concurrent first-request race, or genuine Socket.io handshake test. |
| Navigation, accessibility, design | Frontend `HomeWorkspace`, `PageShell`, `AppNavigation`, `BrandMark`, `RoomCodeInput`, `Timer`, UI button/switch, and `semantic-token-contrast` tests cover selected routes/actions, labels, targets, and token contrast. `homeIntentStore.test.ts` checks one-time file/code handoff; `CreateGame.handoff.test.tsx` checks file handoff including StrictMode remount. | These jsdom tests do not replace browser, screen reader, responsive layout, or visual checks. |

## Mocks, fixtures, and infrastructure

- Backend pure tests construct inline values. `pipeline.test.ts` supplies ordered fake Gemini responses; `storedGeneration.test.ts` injects fake generation, persistence, Redis-status, and queue functions. Persistence and queue tests use in-memory recorders, not Prisma/Postgres or BullMQ services.
- Redis service tests import the shared `backend/src/lib/redis.ts` client and perform real key writes/deletes. Some use fixed IDs, some generated IDs; setup/cleanup is local to each file. They require a dedicated Redis database/instance and a usable `REDIS_URL`. `redis.ts` constructs the client directly from `process.env.REDIS_URL`; running `npm test` does not start Redis. Do not assume local cleanup makes a shared endpoint safe.
- The recovery service test registers handlers against a fake Socket.io `Server`/`Socket` and calls captured callbacks. Frontend socket hooks use event-emitter-like fake sockets. These verify handler/hook decisions, not transport or authentication handshakes.
- Frontend tests use `vi.mock`, `vi.fn`, `MemoryRouter`, React Testing Library, and local test data to replace Clerk, API/data hooks, query state, sockets, and some child components. `frontend/src/test/setup.ts` only installs jest-dom matchers.
- No test database is provisioned in Compose: `docker-compose.yml` defines backend, frontend, and Redis, with Postgres external. `DATABASE_URL` is used by Prisma, but current persistence tests replace the transaction boundary. A full-stack test needs an isolated Postgres database, migrations, dedicated Redis, and test-only Clerk/Gemini handling; no such harness is supplied.
- Backend application configuration is loaded by `src/index.ts`; direct test imports do not necessarily load `backend/.env`. Set only the variables needed by the selected suite, explicitly, against isolated services. Never use real production credentials for tests.

## Regression procedure

1. Follow the changed code path and identify assertions in the map above. Read the test's imports and setup before running it; some apparently pure helper tests import the shared Redis client.
2. Run the narrow test file with `node --import tsx --test path/to/file.test.ts` in `backend/`, or `npm test -- path/to/file.test.tsx` in `frontend/`. Record its exit code and failing assertion, if any.
3. For backend state/socket/worker changes, run `npm test` only after configuring disposable Redis. Check cross-boundary behavior manually or with targeted instrumentation where there is no automated test. For frontend changes, run `npm test`, `npm run lint`, and `npm run build` when dependencies are installed correctly.
4. For changes touching live play, deliberately verify success, invalid input/nonmember failure, duplicate/concurrent answer and round-end handling, disconnect/reconnect, and failed completion retry. Existing tests cover only the specific slices listed above; use an isolated local stack for uncovered flows.
5. Report each command's actual pass/fail/blocked result separately. A failed startup, skipped integration suite, or passing mock test cannot be reported as a passing full feature.

## CI and coverage

No `.github/workflows` directory or other CI configuration was found in this repository checkout. The package scripts are available but no repository workflow currently enforces them. No coverage collection/reporting or minimum threshold is configured.

## Coverage gaps and recommended next steps

These are proposals, not existing tests or enforced checks, ordered by risk:

1. Add an isolated test stack (dedicated Redis and Postgres with migrations) and a CI job that runs the package suites, frontend lint/build, and backend generated-client check. Keep test data away from developer/shared services.
2. Add integration tests for authenticated REST routes, Clerk webhook provisioning/verification, Socket.io handshake identity, room joins/ready/start, and quiz upload/job transitions.
3. Test concurrency and recovery against real Redis: atomic join/readiness/answer submission, timer versus last-answer race, host departure, delayed jobs, reconnect after missed phase, and idempotent game completion.
4. Add real Postgres completion tests for transaction rollback, ties/answers, retry after partial failure, and the Redis-to-Postgres recovery boundary.
5. Add a browser E2E path covering host plus player, generation failure/retry, full game, reconnect, and results; then add coverage reporting with thresholds chosen from measured baseline data.

## Solo practice checks

Run `node --import tsx --test src/services/tests/practice.logic.test.ts` from `backend/` for answer-shape, grading, resume, and safe projection checks. For PostgreSQL integration tests, create a dedicated empty database, apply the migrations, and use a dedicated Redis instance. Set `DATABASE_URL`, `REDIS_URL`, and `RUN_PRACTICE_INTEGRATION_TESTS=true`, then run `node --import tsx --test src/services/tests/practice.integration.test.ts src/services/tests/quizDeletion.integration.test.ts`. These tests cover eligibility, concurrent starts, submission, idempotency, solo-only host exclusion, deletion cascade through practice and source records, live-room deletion ordering, generated-quiz attachment, and cleanup after a transaction failure. They create and remove their own user/quiz fixtures. Never point them at application data. Frontend page checks include `npx vitest run src/pages/PracticeLibrary.test.tsx src/pages/CreatePracticeQuiz.test.tsx` from `frontend/`.
