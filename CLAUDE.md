# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Capital Rush — a real-time multiplayer trivia game (guess the capital city). Players join a room by code, answer rounds against a timer, get placement-based points, and ratings update ELO-style after each game. See `CAPITAL_RUSH_PRD.md` for full product spec, `plan.md` for the phased implementation plan, `architecture.md` for known architectural risks/open questions, and `db_diagram.md` for the schema ER diagram.

**Current state:** early scaffold. Frontend has routing + Clerk auth wiring and placeholder pages. Backend has the Prisma schema/migration and a seed script, but `backend/src/index.js` (the Express/Socket.io server) is not yet implemented — `package.json`'s `dev` script (`tsx watch src/index.ts`) does not match the existing `src/index.js`, so backend dev tooling needs reconciling before the server can run.

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
npm run dev       # tsx watch src/index.ts (currently mismatched — see Current state above)
npm run build     # prisma generate
npm run seed      # tsx scripts/seedCountries.ts — loads seed/countries.json into the countries table
```

Prisma (run from `backend/`):
```
npx prisma migrate dev     # create/apply a migration from schema.prisma
npx prisma studio          # inspect DB contents directly
```

## Architecture

### Two services, three datastores
- **Frontend** (`frontend/`): React 19 + Vite + TypeScript, React Router v7, Clerk (`@clerk/react`) for auth UI/session.
- **Backend** (`backend/`): Express 5 + Socket.io (planned) + Prisma 7 (`@prisma/adapter-pg` driver adapter, client generated to `backend/app/generated/prisma`, not `node_modules/.prisma`).
- **Postgres**: durable source of truth (`users`, `countries`, `games`, `game_players`, `answers` — see `db_diagram.md`).
- **Redis**: live in-progress game state only (per-game hash/keys, TTL'd), never the durable record of a finished game.

### Auth flow
Clerk owns identity. The backend does not have its own signup/login — a `users` row is created via a Clerk webhook (`user.created`) rather than at request time, which means there's a real race between "user signed up in Clerk" and "backend has a matching row" (see `architecture.md` #3 and `plan.md`'s Risk #3 for the open question on how this is handled). REST routes are protected by Clerk session-token verification middleware that attaches `clerk_user_id` to the request; the Socket.io handshake is authenticated the same way.

### Game lifecycle (Redis during play, Postgres after)
1. Room created (`POST /api/games`) → room code generated, initial state written to Redis (`waiting`, empty players, difficulty, rounds). No Postgres row yet.
2. Lobby: join/ready/leave events mutate the Redis player list and broadcast over Socket.io. Host is tracked in Redis (first-joined or explicit `hostId`).
3. Host starts → a `games` Postgres row is created (`status: playing`) and Redis flips to `playing`. From here, round state (current round, country, `startedAt`, per-round correct-answer counts) lives in Redis only.
4. Each round: server picks a country from the difficulty pool, starts an **application-level timer** (`setTimeout` off `startedAt`, not Redis TTL-expiry — this distinction matters, see `architecture.md` #5), scores submissions atomically (placement = result of an atomic `INCR` on a per-round correct-count key — 1st/2nd/3rd/late-but-correct map to fixed point values), and broadcasts round results.
5. Game finish: final ranks computed, then **one Postgres transaction** writes `games` (finished + winner), `game_players` (score/rank/rating_change), and `answers` for every round — this is meant to be a single durable boundary, not sequential best-effort writes (see `architecture.md` #3 on why partial-write failure here is a real risk to design around, not an edge case to skip).
6. ELO-style rating updates apply inside that same transaction. The multi-player (2-8 player) ELO extension formula is a documented open design decision, not yet settled — check `plan.md`'s Open Questions before implementing Phase 4's rating logic.

### Key invariants to preserve when touching this code
- Don't let Redis become a second source of truth for anything that also has a Postgres column — Redis holds *live* state; Postgres holds *finished* state. If they can drift, that's a bug, not a feature.
- Round-end must be driven by server-tracked elapsed time (`startedAt` + `timeLimit`), independent of any client-reported timer — the "late submission" rule depends on this.
- Per-round placement scoring must stay atomic (single Redis round-trip, e.g. `INCR`) — a read-then-write across two round-trips reintroduces the race described in `architecture.md` #2.
- Socket.io broadcasts currently assume single-instance deployment (no Redis adapter wired up) — don't add a second server instance assumption without also adding the adapter.

## Design system (frontend)

Dark editorial game UI — not a busy "gaming" aesthetic. Thin borders, oversized numbers, monospaced UI labels, restrained motion. Avoid maps, globes, flag collages, gradients everywhere, or multiple bright accent colors.

**Fonts:**
| Role | Font | Weight | Use |
|---|---|---|---|
| Display/headlines | DM Serif Display | 400 | Hero headline, section headlines, featured quotes |
| Body/UI | Inter | 400–700 | Navigation, paragraphs, buttons, game facts, forms |
| Numbers/metadata | JetBrains Mono | 500–600 | ELO, timer, scores, labels like `ROUND 03 / 10` |

**Colors:**
| Role | Value |
|---|---|
| Background | charcoal `#0B0F14` |
| Primary accent | vivid blue `#5B8CFF` |
| Text | warm white `#F5F5F0` (not pure white) |

Icons: `lucide-react`.
