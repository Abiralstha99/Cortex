// This file defines the types for the waiting room and game room

export type GameStatus = "waiting" | "playing" | "finished" | "cancelled";

// `id` is the Postgres users.id (not the Clerk id — see the id boundary note
// in CLAUDE.md). `ready` gates the host's ability to start the game.
export type Player = {
  id: string;
  username: string;
  ready: boolean;
  score: number;
};

export type WaitingRoom = {
  gameId: string;
  quizId: string;
  players: Player[];
  status: GameStatus;
  hostId: string;
  roomCode: string;
  createdAt: Date;
  numberOfRounds: number;
};

export type ActiveGame = Omit<WaitingRoom, "status"> & {
  status: "playing";
  currentRound: number;
  usedQuestionIds: string[];
};

/** Question payload loaded from Postgres / nextQuestion prefetch */
export type QuestionPick = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

// Current round state — promoted at the start of each round.
export type Round = {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number; // server-only until round end
  explanation: string; // server-only until round end
  startedAt: string;
  roundNumber: number;
};

// Per-player submission stored in Redis during a round.
// Written atomically by the Lua submission script; flushed to Postgres at game end.
export type SubmissionRecord = {
  playerId: string;
  roundNumber: number;
  questionId: string;
  answerIndex: number;
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
  submittedAt: string;
};

// Payload broadcast to the submitting player after their answer is processed.
export type AnswerResult = {
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
  correctAnswer: string;
};

// One entry in the round-end leaderboard broadcast.
export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
};

// Payload for the round_finished broadcast.
export type RoundFinishedPayload = {
  roundNumber: number;
  correctAnswer: string;
  submissions: Pick<
    SubmissionRecord,
    "playerId" | "correct" | "pointsEarned" | "placement"
  >[];
  leaderboard: LeaderboardEntry[];
  isLastRound: boolean;
  nextRoundIn: number;
};

// Payload for the game_finished broadcast.
export type GameFinishedPayload = {
  finalLeaderboard: LeaderboardEntry[];
  winner: { playerId: string; username: string; score: number };
};
