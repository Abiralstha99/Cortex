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
//     usedQuestionIds string   — JSON: string[] (question UUIDs) grows each round
export const GAME_KEY = (gameId: string) => `game:${gameId}`;

// ROUND_KEY      game:<gameId>:round           hash
//   Set at the start of each round by startRound():
//     roundNumber       string   — coerced number
//     questionId        string   — questions.id UUID
//     question          string   — prompt text shown to players
//     options           string   — JSON string[4]
//     correctIndex      string   — 0-3 (server-only until round_finished)
//     explanation       string   — server-only (broadcast at round end later)
//     startedAt         string   — ISO date
//     submissionCount   string   — HINCRBY in Lua submission script
export const ROUND_KEY = (gameId: string) => `game:${gameId}:round`;

// NEXT_QUESTION_KEY  game:<gameId>:nextQuestion  string
//   Prefetch buffer — JSON QuestionPick { id, question, options, correctIndex, explanation }
//   lifecycle: written after startRound(), consumed + deleted by the next startRound()
export const NEXT_QUESTION_KEY = (gameId: string) =>
  `game:${gameId}:nextQuestion`;

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
//   Acts as the duplicate-submission guard: SET NX, rejected if already exists.
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
