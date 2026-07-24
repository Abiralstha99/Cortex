# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Capital Rush — a real-time multiplayer trivia game (guess the capital city). Players join a room by code, answer rounds against a timer, get placement-based points, and ratings update ELO-style after each game. See `docs/CAPITAL_RUSH_PRD.md` for full product spec, `docs/plan.md` for the phased implementation plan, `architecture.md` (repo root) for known architectural risks/open questions, `docs/design-decisions.md` and `docs/system.md` for deeper design/system notes, and `docs/db_diagram.md` for the schema ER diagram.

**Current state:** the backend server now runs (`backend/src/index.ts`) — Express + Socket.io are both wired up, so the earlier `dev`-script/entrypoint mismatch is resolved. Built so far:
- Express app with CORS, Clerk middleware, and a Svix-verified Clerk webhook mounted on the raw body *before* `express.json()`.
- `requireAuth` middleware (attaches `req.userId` = Clerk user id) protecting `/api/users`.
- Socket.io attached to the same HTTP server, authenticated on the handshake via `SocketAuth` (verifies the Clerk token, sets `socket.data.username = session.sub`). Currently only emits a hello on connect — no lobby events yet.
- `POST /api/games/waiting/` → creates a **waiting room in Redis only** (reserves a unique room code, writes a `game:<gameId>` hash with a 1-hour TTL). This is lifecycle step 1 below; nothing further is implemented.

Not yet built: lobby join/ready/leave socket events, game start (Postgres `games` row), round/scoring logic, the finish transaction, and ELO. Redis is not yet wired as a Socket.io adapter.

## Commands

Two independent Node projects, no shared workspace config — run commands from within each directory.

### Frontend (`frontend/`)
```
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # preview production build
```

### Backend (`backend/`)
```
npm run dev       # tsx watch src/index.ts — starts the server on port 3000
npm run build     # prisma generate
npm run start     # node dist/index.js (expects a prior tsc/build step; no bundler wired yet)
npm run seed      # tsx scripts/seedCountries.ts — loads seed/countries.json into the countries table
```

Requires `REDIS_URL`, `CLERK_SECRET_KEY`, and the Postgres connection env used by the Prisma pg adapter; `CLIENT_ORIGIN` defaults to `http://localhost:5173`. A `Dockerfile` and a compose setup (backend/frontend/Redis) exist.

Prisma (run from `backend/`):
```
npx prisma migrate dev     # create/apply a migration from schema.prisma
npx prisma studio          # inspect DB contents directly
```

## Architecture

### Two services, three datastores
- **Frontend** (`frontend/`): React 19 + Vite + TypeScript, React Router v7, Clerk (`@clerk/react`) for auth UI/session, `socket.io-client` (see `src/lib/socket.ts` + `useSocket` hook), `lucide-react` for icons.
- **Backend** (`backend/`): Express 5 + Socket.io (wired) + Prisma 7 (`@prisma/adapter-pg` driver adapter, client generated to `backend/app/generated/prisma`, not `node_modules/.prisma`). Redis via `ioredis` (single shared client in `src/lib/redis.ts`); Clerk via `@clerk/express`; Svix for webhook verification.
- **Postgres**: durable source of truth (`users`, `countries`, `games`, `game_players`, `answers` — see `docs/db_diagram.md`).
- **Redis**: live in-progress game state only (per-game hash/keys, TTL'd), never the durable record of a finished game.

Backend is ESM (`"type": "module"`, NodeNext): **relative imports must carry the `.js` extension** (e.g. `import ... from "./game/gameService.js"`) even though the source is `.ts`. Files follow a role-suffixed naming convention: `*.routes.ts`, `*.controller.ts`, `*.middleware.ts`; game logic lives under `src/game/`.

### Auth flow
Clerk owns identity. The backend does not have its own signup/login — a `users` row is created via a Clerk webhook (`user.created`) rather than at request time, which means there's a real race between "user signed up in Clerk" and "backend has a matching row" (see `architecture.md` #3 and `docs/plan.md`'s Risk #3 for the open question on how this is handled). REST routes are protected by `requireAuth` (`getAuth` from `@clerk/express`), which attaches the **Clerk user id** as `req.userId`. The Socket.io handshake is authenticated separately in `SocketAuth` — it reads `socket.handshake.auth.token`, calls `verifyToken`, and stores the Clerk user id as `socket.data.username` (naming quirk: it holds a Clerk id, not a username).

Note the id boundary: Clerk ids only live at these auth edges. Inside the game/Redis layer, `hostId` and `players` hold **Postgres `users.id`** — the create-game route resolves `req.userId` (Clerk) → `users.id` (Postgres) before calling the service. Don't mix the two.

### Game lifecycle (Redis during play, Postgres after)
1. **(implemented)** Room created (`POST /api/games/waiting/`) → a unique room code is reserved in Redis (`room-code:<code>` set with `NX`+TTL, retried on collision, see `src/game/roomCode.ts`), then a `game:<gameId>` hash is written via a `MULTI` with a 1-hour TTL (`waiting` status, `players: [hostId]`, difficulty, `numberOfRounds`, `hostId`, `roomCode`). No Postgres row yet. Redis key builders live in `src/game/redisKeys.ts`.
2. Lobby: join/ready/leave events mutate the Redis player list and broadcast over Socket.io. Host is tracked in Redis (first-joined or explicit `hostId`).
3. Host starts → a `games` Postgres row is created (`status: playing`) and Redis flips to `playing`. From here, round state (current round, country, `startedAt`, per-round correct-answer counts) lives in Redis only.
4. Each round: server picks a country from the difficulty pool, starts an **application-level timer** (`setTimeout` off `startedAt`, not Redis TTL-expiry — this distinction matters, see `architecture.md` #5), scores submissions atomically (placement = result of an atomic `INCR` on a per-round correct-count key — 1st/2nd/3rd/late-but-correct map to fixed point values), and broadcasts round results.
5. Game finish: final ranks computed, then **one Postgres transaction** writes `games` (finished + winner), `game_players` (score/rank/rating_change), and `answers` for every round — this is meant to be a single durable boundary, not sequential best-effort writes (see `architecture.md` #3 on why partial-write failure here is a real risk to design around, not an edge case to skip).
6. ELO-style rating updates apply inside that same transaction. The multi-player (2-8 player) ELO extension formula is a documented open design decision, not yet settled — check `docs/plan.md`'s Open Questions before implementing Phase 4's rating logic.

### Key invariants to preserve when touching this code
- Don't let Redis become a second source of truth for anything that also has a Postgres column — Redis holds *live* state; Postgres holds *finished* state. If they can drift, that's a bug, not a feature.
- Round-end must be driven by server-tracked elapsed time (`startedAt` + `timeLimit`), independent of any client-reported timer — the "late submission" rule depends on this.
- Per-round placement scoring must stay atomic (single Redis round-trip, e.g. `INCR`) — a read-then-write across two round-trips reintroduces the race described in `architecture.md` #2.
- Socket.io broadcasts currently assume single-instance deployment (no Redis adapter wired up) — don't add a second server instance assumption without also adding the adapter.

