# QuizRush — Product Requirements Document

**Version:** 2.0
**Last Updated:** 2026-08-03
**Status:** In Development
**Owner:** Engineering Team

---

## Executive Summary

QuizRush is a real-time multiplayer quiz platform where students upload their own notes and the AI generates quiz questions from them. Players can practice solo with flashcards or compete with friends in a live multiplayer quiz session. The platform is designed as a backend and AI engineering showcase: a robust extraction→prompt→structured-JSON pipeline with validation/retry logic, combined with a real-time multiplayer game loop backed by Socket.io, Redis, and BullMQ.

**Core Value Proposition:**
- Upload your notes → AI generates quiz questions instantly
- Practice solo (flashcard mode) or compete live with friends (quiz mode)
- Real-time multiplayer with WebSocket infrastructure
- Persistent player ratings updated after each quiz session

---

## Product Vision

### Objectives
1. Demonstrate a production-grade AI pipeline: document extraction → semantic chunking → LLM generation → schema validation with retry logic
2. Showcase real-time system design: Socket.io multiplayer, Redis game state, BullMQ delayed jobs
3. Build a genuinely useful study tool, not just a tech demo

### Success Metrics
- Pipeline: >90% of valid PDF/text uploads produce at least 1 valid question
- Latency: quiz generation completes in <15s for a 5-page PDF
- Game state updates: <200ms latency end-to-end
- Lobby join time: <1s

---

## User Stories & Requirements

### 1. Authentication & User Management

**US-1.1: User Registration**
- Handled by Clerk's hosted/embedded sign-up UI — Clerk owns credential storage
- On first sign-in, backend receives `user.created` webhook and creates a `users` row (username, default rating 1200)
- Username (3-20 chars, alphanumeric + underscore) collected as a custom field during Clerk onboarding

**US-1.2: User Login**
- Handled entirely by Clerk's client SDK
- Backend verifies the Clerk session token on incoming requests and WebSocket connections

**US-1.3: User Profile**
- Display: username, rating, quizzes played, win %, recent sessions

---

### 2. Quiz Generation Pipeline

**US-2.1: Document Upload**
- User uploads a PDF or plain text file
- File size limit: 10MB
- Supported types: `application/pdf`, `text/plain`

**US-2.2: Question Generation**
- User specifies desired question count (1–50, capped at 50)
- Server runs the pipeline: extraction → semantic chunking → Groq LLM generation → Zod validation
- Returns structured multiple-choice questions

**US-2.3: Question Format**
Each generated question:
```json
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0 | 1 | 2 | 3,
  "explanation": "string"
}
```

**US-2.4: Validation & Retry**
- LLM output is Zod-validated against the schema above
- On failure, the Zod error is fed back into the prompt and retried (up to 3 attempts per chunk)
- A chunk that exhausts all retries is skipped — the pipeline is non-fatal
- Duplicate questions (>80% text similarity) are rejected

**US-2.5: Quiz Storage**
- Generated quiz saved to Postgres as a `quizzes` row with associated `questions` rows
- Linked to the creating user; can be reused for multiple game sessions

---

### 3. Game Lobby & Room Management

**US-3.1: Create Game Room**
- Host selects a saved quiz and creates a room (auto-generated room code: ABC123)
- Status: waiting → playing → finished

**US-3.2: Join Game Room**
- Player enters room code
- Accept up to 8 players per room
- Lobby shows player list and ready status

**US-3.3: Start Game**
- Only host can start
- All players must be ready
- Broadcasts `game_started` with `countdownMs: 3000` before first question

**US-3.4: Leave Room**
- Players can leave before game starts (no penalty)
- If host leaves, transfer to next oldest player

---

### 4. Core Gameplay Loop

**US-4.1: Question Delivery**
- Server sends one question per round (question + options, no correctIndex revealed)
- Format: `{ roundNumber, question, options, startedAt, timeLimit: 30 }`
- `startedAt` stored in Redis; used for late-submission validation server-side

**US-4.2: Answer Submission**
- Player selects an option index (0-3)
- Client sends: `{ gameId, questionIndex, answerIndex, responseTime }`
- Server validates before `timeLimit` expires

**US-4.3: Scoring**
- First correct: 100 points
- Second correct: 75 points
- Third correct: 50 points
- Correct after time expires: 25 points
- Wrong answer: 0 points

**US-4.4: Round Progression**
- Round ends when all players answer OR BullMQ delayed job fires after `timeLimit`
- `SET NX` guard key ensures exactly one path executes round-end
- Broadcast `round_finished`: correct answer, explanation, all player submissions, updated in-game leaderboard
- 3s pause → next question

**US-4.5: Game Conclusion**
- After final round: compute final ranks, broadcast `game_finished`
- Single Postgres transaction: `games`, `game_players`, `answers`, ELO changes — all or nothing

**Why This Matters:** a half-committed game (scores saved, ratings not) is the worst failure mode. One transaction means the whole game is durably saved or none of it is.

---

### 5. Leaderboards & Stats

**US-5.1: In-Game Leaderboard**
- Live standings for the current session only: rank, username, current score
- Delivered as part of `round_finished` payload — no separate fetch, no polling
- Derived by sorting `game:{gameId}.players` by score desc after each round

**US-5.2: Player Stats**
- Total sessions, wins, current rating, win %
- Computed on read via Postgres query on `game_players`/`games`

---

### 6. Real-Time Communication (WebSockets)

#### Client → Server Events
| Event | Payload |
|-------|---------|
| `join_game` | `{ roomCode }` |
| `player_ready` | `{ roomCode }` |
| `submit_answer` | `{ gameId, questionIndex, answerIndex, responseTime }` |
| `leave_room` | `{ roomCode }` |

#### Server → Client Events
| Event | Payload |
|-------|---------|
| `player_joined` | `{ playerId, username }` |
| `player_left` | `{ playerId }` |
| `player_ready` | `{ playerId, ready }` |
| `game_started` | `{ gameId, countdownMs: 3000 }` |
| `new_question` | `{ roundNumber, question, options, startedAt }` |
| `answer_submitted` | `{ playerId, username }` (no answer revealed yet) |
| `round_finished` | `{ correctIndex, explanation, submissions, leaderboard, isLastRound, nextRoundIn }` |
| `game_finished` | `{ finalLeaderboard, winner }` |
| `error` | `{ message }` |

---

## Data Models

### PostgreSQL Schema

#### `users`
```sql
id: UUID (primary)
clerk_user_id: VARCHAR(255) UNIQUE NOT NULL
username: VARCHAR(20) UNIQUE NOT NULL
email: VARCHAR(255) UNIQUE NOT NULL
rating: INTEGER DEFAULT 1200
games_played: INTEGER DEFAULT 0
wins: INTEGER DEFAULT 0
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

#### `quizzes`
```sql
id: UUID (primary)
owner_id: UUID (foreign key → users)
title: VARCHAR(255) NOT NULL
source_type: ENUM('pdf', 'text')
question_count: INTEGER NOT NULL
created_at: TIMESTAMP DEFAULT NOW()
```

#### `questions`
```sql
id: UUID (primary)
quiz_id: UUID (foreign key → quizzes)
question: TEXT NOT NULL
options: JSONB NOT NULL        -- string[4]
correct_index: INTEGER NOT NULL -- 0-3
explanation: TEXT NOT NULL
position: INTEGER NOT NULL      -- order within the quiz
created_at: TIMESTAMP DEFAULT NOW()
```

#### `games`
```sql
id: UUID (primary)
quiz_id: UUID (foreign key → quizzes)
host_id: UUID (foreign key → users)
status: ENUM('waiting', 'playing', 'finished', 'cancelled') DEFAULT 'waiting'
rounds: INTEGER NOT NULL
created_at: TIMESTAMP DEFAULT NOW()
finished_at: TIMESTAMP
winner_id: UUID (nullable, foreign key → users)
```

#### `game_players`
```sql
id: UUID (primary)
game_id: UUID (foreign key → games)
user_id: UUID (foreign key → users)
score: INTEGER DEFAULT 0
rank: INTEGER
rating_change: INTEGER
abandoned: BOOLEAN DEFAULT FALSE
created_at: TIMESTAMP DEFAULT NOW()
```

#### `answers`
```sql
id: UUID (primary)
game_id: UUID (foreign key → games)
user_id: UUID (foreign key → users)
question_id: UUID (foreign key → questions)
answer_index: INTEGER NOT NULL
correct: BOOLEAN NOT NULL
points: INTEGER NOT NULL
response_time_ms: INTEGER
created_at: TIMESTAMP DEFAULT NOW()
```

### Redis Schema

#### Game State
```
game:<gameId>  (hash)
  gameId, roomCode, hostId, quizId
  status: "waiting" | "playing" | "finished" | "cancelled"
  players: JSON Player[]  { id, username, score, ready }
  numberOfRounds, currentRound
  usedQuestionIds: JSON string[]
  createdAt
TTL: 1 hour
```

#### Round State
```
game:<gameId>:round  (hash)
  roundNumber, questionId, correctIndex, startedAt
  (correctIndex stored server-side only — NOT broadcast until round ends)
```

#### Timer
Round-end is driven by a **BullMQ delayed job**, not Redis key-expiry. `startedAt` is stored in the round hash for late-submission validation only.

**Why BullMQ over setTimeout:** BullMQ jobs persist in Redis across process restarts. A plain `setTimeout` is lost on crash; a hung round is a bad player experience. Redis keyspace notifications were rejected: at-most-once delivery, requires `notify-keyspace-events` config (easy to miss on managed Redis), missed notification = round hangs forever.

#### Auxiliary Keys
```
room-code:<roomCode>                          → gameId
game:<gameId>:round:<n>:correctCount         → integer (INCR for placement, atomic)
game:<gameId>:round:<n>:submissions:<pid>    → JSON SubmissionRecord
game:<gameId>:round:<n>:ended                → "1" (SET NX round-end guard)
game:<gameId>:nextQuestion                   → JSON prefetch buffer
```

---

## Architecture & System Design

### Tech Stack
- **Backend:** Node.js + Express 5
- **Real-Time:** Socket.io (single instance for MVP; `@socket.io/redis-adapter` deferred to post-MVP)
- **AI Pipeline:** Groq SDK (`llama-3.3-70b-versatile`) — free tier, fast inference
- **File Parsing:** `pdf-parse` (PDF), native Buffer (plain text)
- **Queue:** BullMQ (round-end delayed jobs, backed by Redis)
- **Database:** Postgres via Prisma (`@prisma/adapter-pg`)
- **Cache:** Redis via `ioredis`
- **Authentication:** Clerk
- **Frontend:** React 19 + Vite + TypeScript, Zustand, TanStack Query
- **Deployment:** Docker Compose (dev), Railway (backend), Vercel (frontend)

### Key Architectural Invariants
- Redis holds *live* state; Postgres holds *finished* state. They must not drift.
- Round-end executes via BullMQ delayed job OR last-submission handler — never both. `SET NX` guard enforces this.
- Placement scoring uses a **Lua `EVAL` script**: atomically increments `correctCount` and writes the submission record in one Redis operation. Never split into separate round-trips.
- Game-end Postgres write is a **single transaction**: `games`, `game_players`, `answers`, rating changes — all or nothing.
- AI pipeline retry: on Zod validation failure, the error string is fed back into the Groq prompt and retried (max 3 attempts per chunk).

### API Endpoints

#### Quiz Generation
- `POST /api/quiz/generate` — multipart upload + count → pipeline → return questions + persist
- `GET /api/quizzes` — list user's saved quizzes
- `GET /api/quizzes/:quizId` — get quiz with questions

#### Games
- `POST /api/games` — create game room (requires `quizId`)
- `GET /api/games/:gameId` — game state
- `GET /api/games/:gameId/results` — post-game results

#### Users
- `GET /api/users/:userId` — profile + stats
- `PUT /api/users/:userId` — update profile
- `GET /api/users/:userId/games` — game history

---

## Error Handling & Edge Cases

### Race Conditions
Two players submit correct answers simultaneously → `INCR correctCount` via Lua script is atomic; returned value IS the placement. No read-then-write race.

### Late Submissions
Server checks `(submittedAt - startedAt) > timeLimit`. Client timer is cosmetic only. Late-correct earns 25 points.

### Pipeline Failures
Chunk exhausts 3 retry attempts → skip chunk, continue. Pipeline returns whatever was successfully generated plus metadata indicating partial results.

### Player Abandonment
Disconnect → 5s grace → mark `abandoned`, award 0 pts for remaining rounds, apply rating penalty at game-end.

### Redis Failure
If Redis key is missing mid-game, kick players to lobby, mark `games` row `cancelled`, skip rating changes.

---

## Future Enhancements (Phase 2+)

1. Flashcard spaced repetition — resurface weak areas
2. DOCX / image (OCR) support
3. Adaptive difficulty — question order adapts per player performance
4. Socket.io Redis adapter — multi-instance deployment
5. BullMQ pipeline jobs — async generation for large documents
6. Public quiz library — share quizzes with other users
7. Clan/team mode, spectator mode

---

**Last Reviewed:** 2026-08-03
