// Redis key catalogue
//
// ROOM_CODE_KEY  room-code:<roomCode>          string
//   value: gameId
//   ttl:   mirrors GAME_KEY (set on creation, deleted on empty/finish)
export const ROOM_CODE_KEY = (roomCode: string) => `room-code:${roomCode}`;

// GAME_KEY       game:<gameId>                 hash
//   Waiting-room fields (set on creation):
//     gameId          string   — UUID
//     roomCode        string   — 6-char code
//     hostId          string   — Postgres users.id of the host
//     quizId          string   — Postgres quizzes.id UUID, or "" if not ready
//     quizGenStatus   string   — "none" | "processing" | "ready" | "failed"
//     quizGenJobId    string   — async job id or ""
//     quizGenError    string   — last failure message or ""
//     numberOfRounds  string   — coerced number (questions to play)
//     maxPlayers      string   — coerced number (lobby capacity, default 8)
//     players         string   — JSON: Player[]  { id, username, ready, score }
//     status          string   — "waiting" | "playing" | "finished" | "cancelled"
//     createdAt       string   — ISO date
//   Added when game starts (status → "playing"):
//     currentRound    string   — coerced number, starts at 0
//     questionOrder   string   — shuffled JSON question UUIDs, private to this game
//     quizVersion     string   — hash of the pinned quiz question snapshot
//     currentQuestionIndex string — zero-based index in questionOrder (-1 before round 1)
//     lastScoredRound string — score application guard for round-end retries
//     phaseVersion    string   — monotonic public phase sequence, starts with countdown
//     publicPhase     string   — countdown | question | round_results | game_finished
//     publicPayload   string   — JSON of the last phase broadcast, without its version
//   resume_game snapshots return gameId, numberOfRounds, phaseVersion, phase,
//   payload, myAnswer and answerResult. The player's submission is read from
//   SUBMISSION_KEY. Public question payload never includes the answer key.
//   GAME_KEY and ROOM_CODE_KEY TTLs refresh to two hours when play starts.
export const GAME_KEY = (gameId: string) => `game:${gameId}`;

// ROUND_KEY      game:<gameId>:round           hash
//   Set at the start of each round by startRound():
//     roundNumber       string   — coerced number
//     questionId        string   — questions.id UUID
//     question          string   — prompt text shown to players
//     type              string   — MCQ | TRUE_FALSE | FILL_BLANK
//     content           string   — server-only JSON question content
//     explanation       string   — server-only during play
//     startedAt         string   — ISO date
//     submissionCount   string   — HINCRBY in Lua submission script
export const ROUND_KEY = (gameId: string) => `game:${gameId}:round`;

// QUIZ_QUESTIONS_KEY quiz:<quizId>:questions string (JSON QuizSnapshot)
//   Shared, server-only question data. Its content hash pins active games to a
//   consistent snapshot. The TTL is refreshed when a game reads it.
export const QUIZ_QUESTIONS_KEY = (quizId: string) =>
  `quiz:${quizId}:questions`;

// GAME_START_LOCK_KEY game:<gameId>:start-lock string
//   Short-lived claim preventing concurrent start_game requests for one room.
export const GAME_START_LOCK_KEY = (gameId: string) =>
  `game:${gameId}:start-lock`;

// CORRECT_COUNT_KEY  game:<gameId>:round:<n>:correctCount   string (integer)
//   Atomically incremented (INCR) each time a player submits a correct answer.
//   The value returned by INCR IS the player's placement (1st, 2nd, 3rd, ...).
//   Used inside the Lua submission script — never read-then-write separately.
//   TTL: expires with the round (set alongside ROUND_KEY).
export const CORRECT_COUNT_KEY = (gameId: string, round: number) =>
  `game:${gameId}:round:${round}:correctCount`;

// SUBMISSION_KEY  game:<gameId>:round:<n>:submissions:<playerId>   string
//   Written atomically inside the Lua submission script.
//   value: JSON SubmissionRecord — see types/room.types.ts
//   Acts as the duplicate-submission guard: Lua checks EXISTS and writes the
//   fully scored record in the same atomic operation.
export const SUBMISSION_KEY = (
  gameId: string,
  round: number,
  playerId: string,
) => `game:${gameId}:round:${round}:submissions:${playerId}`;

// ROUND_ENDED_KEY  game:<gameId>:round:<n>:ended   string
//   SET NX guard — whichever path (BullMQ job or last-submission handler) sets
//   this key first is the sole executor of round-end logic; the other bails out.
//   value: "1"
export const ROUND_ENDED_KEY = (gameId: string, round: number) =>
  `game:${gameId}:round:${round}:ended`;

// ROUND_END_JOB_ID  game_<gameId>_round_<n>_end
//   Job ID for BullMQ round-end jobs. BullMQ doesn't allow colons in job IDs,
//   so we use underscores instead. This is separate from ROUND_ENDED_KEY.
export const ROUND_END_JOB_ID = (gameId: string, round: number) =>
  `game_${gameId}_round_${round}_end`;

// QUIZ_GEN_JOB_KEY  quiz-gen:job:<jobId>   string (JSON QuizGenJob)
//   Pollable async generation status: processing | ready | failed.
//   Ready includes quizId (Postgres). Failed includes errorMessage.
//   TTL ~1 hour — jobs are not durable history.
export const QUIZ_GEN_JOB_KEY = (jobId: string) => `quiz-gen:job:${jobId}`;

// QUIZ_GEN_WORK_KEY  quiz-gen:work:<jobId>   string (JSON QuizGenWorkPayload)
//   Transient planned batches for the BullMQ worker. TTL 1 hour.
//   Cleared when the job finishes (ready or failed).
export const QUIZ_GEN_WORK_KEY = (jobId: string) => `quiz-gen:work:${jobId}`;

// QUIZ_GEN_INFLIGHT_KEY  quiz-gen:inflight:<ownerId>   string
//   Short SET NX guard against double-click double enqueue (not a content cache).
export const QUIZ_GEN_INFLIGHT_KEY = (ownerId: string) =>
  `quiz-gen:inflight:${ownerId}`;
//
// PUBLIC_WAITING_ZSET  public-waiting   sorted set
//   member: gameId
//   score:  createdAt epoch ms (newest = highest)
//   lifecycle: ZADD when isPublic on create; ZREM on start / empty leave / list prune
export const PUBLIC_WAITING_ZSET = "public-waiting";
