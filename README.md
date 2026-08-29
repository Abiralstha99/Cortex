# Cortex

**Real-time multiplayer quizzes generated from your own notes.**

Cortex turns study material into a live competition: upload a PDF, let an LLM generate validated multiple-choice questions, invite friends into a lobby, and play timed rounds over WebSockets. Built as a full-stack systems project focused on real-time state, durable persistence, and a production-shaped AI pipeline.

---

## Highlights

- **AI quiz pipeline** — PDF/text extraction → semantic chunking → Gemini generation → Zod validation with retry
- **Lobby-first UX** — create a room immediately; generation runs in the background with in-lobby status and host retry
- **Real-time multiplayer** — Socket.io lobby join/ready/leave, room codes, host-controlled start
- **Split datastores** — Redis for live waiting/game state (TTL’d); PostgreSQL (Prisma) for durable users, quizzes, and finished games
- **Auth** — Clerk for identity; webhook-provisioned user rows; JWT verified on REST and WebSocket handshakes
- **Containerized local stack** — Docker Compose for backend, frontend, and Redis

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, React Router, Tailwind CSS, Zustand, Socket.io client, Clerk |
| **Backend** | Node.js, Express 5, Socket.io, Zod, Multer, BullMQ |
| **AI** | Vercel AI SDK, Google Gemini (`GEMINI_API_KEY`) |
| **Data** | PostgreSQL + Prisma 7, Redis (ioredis) |
| **Infra** | Docker Compose |

---

## How it works

```text
Upload notes (PDF)
        │
        ▼
Extract → chunk → LLM batches → validate (Zod + retry)
        │
        ▼
Waiting room (Redis)  ◄── Socket.io lobby (join / ready / start)
        │
        ▼
Live rounds (Redis + delayed jobs) → persist results (Postgres)
```

**Design principle:** Redis holds *ephemeral* in-progress state. Postgres is the source of truth for anything that must survive a crash or matter after the session ends. Mixing those roles is treated as a bug, not a feature.

---

## Repository structure

```text
cortex/                          # repo root (local folder may still be capital-rush)
├── backend/
│   ├── prisma/                  # schema + migrations (users, quizzes, games, answers)
│   ├── scripts/                 # seeds and smoke scripts
│   ├── seed/                    # static seed data
│   └── src/
│       ├── controllers/         # HTTP handlers
│       ├── routes/              # Express route mounting
│       ├── middleware/          # auth and request guards
│       ├── schemas/             # Zod request/domain schemas (+ tests)
│       ├── services/            # domain logic
│       │   └── quiz/            # extract → chunk → generate → validate → persist
│       ├── socket/              # Socket.io lobby / game handlers
│       ├── workers/             # BullMQ job consumers
│       ├── webhooks/            # Clerk user.created provisioning
│       ├── lib/                 # Redis client, key builders, shared utilities
│       └── types/               # shared TypeScript types
├── frontend/
│   ├── public/                  # static assets
│   └── src/
│       ├── pages/               # Landing, auth, dashboard, create/join, lobby, game
│       ├── components/          # UI by feature (lobby, quiz-rooms, game, landing)
│       ├── hooks/               # Socket and data hooks
│       ├── stores/              # Zustand lobby/game state
│       ├── lib/                 # API client, socket helper
│       └── clerk/               # Clerk provider wiring
├── docs/                        # PRD, architecture notes, design decisions
└── docker-compose.yml           # backend + frontend + Redis
```

---

## Getting started

### Prerequisites

- Node.js 20+ (22+ preferred)
- Docker + Docker Compose
- Clerk application (publishable + secret keys, webhook secret)
- Google Gemini API key
- PostgreSQL connection string (local or hosted)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd capital-rush   # or your local clone path

# Create backend/.env with at least:
#   DATABASE_URL, DIRECT_URL, REDIS_URL, CLIENT_ORIGIN,
#   CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET,
#   GEMINI_API_KEY

# Create frontend/.env with:
#   VITE_CLERK_PUBLISHABLE_KEY
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)
- Redis: `localhost:6379`

### 3. Run services locally (optional)

```bash
# Terminal 1 — Redis (or use Compose redis only)
docker compose up redis

# Terminal 2 — backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Terminal 3 — frontend
cd frontend
npm install
npm run dev
```

### Useful backend scripts

```bash
cd backend
npm test                 # unit/integration tests under src/
npm run seed             # seed countries (legacy / related data)
npm run smoke:quiz-pipeline
```

---

## Future implementation

- Complete end-to-end play loop polish (round UX, results screens, reconnect handling)
- Finish transaction for game completion (ranks, answers, rating changes in one Postgres boundary)
- Multi-player ELO / rating updates with a settled formula for 2–8 players
- Socket.io Redis adapter for safe multi-instance deployments
- Solo flashcard / practice mode from the same generated quiz bank
- Stronger observability (structured logs, generation metrics, failed-job alerts)
- Horizontal scaling playbook (sticky sessions vs Redis adapter, rate limits)

---

## License

Private / personal project — not licensed for redistribution unless stated otherwise.
