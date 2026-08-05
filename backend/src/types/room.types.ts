// This file defines the types for the waiting room and game room

import type { Difficulty } from "../schemas/game.js";

export type { Difficulty };
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
  difficulty: Difficulty;
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
  usedCountryIds: number[];
};

// Current round state — promoted at the start of each round.
export type Round = {
  countryId: number;
  country: string;
  capital: string; // server-only: not broadcast to clients
  options: string[]; // 4 MCQ choices, index-aligned with correctIndex
  correctIndex: number; // server-only: not broadcast to clients
  startedAt: string;
  roundNumber: number;
};

// Per-player submission stored in Redis during a round.
// Written atomically by the Lua submission script; flushed to Postgres at game end.
export type SubmissionRecord = {
  playerId: string;
  roundNumber: number;
  countryId: number;
  answerIndex: number; // index of the selected MCQ option
  correct: boolean;
  pointsEarned: number;
  placement: number | null; // null if incorrect
  submittedAt: string; // ISO date
};

// Payload broadcast to the submitting player after their answer is processed.
export type AnswerResult = {
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
  correctAnswer: string; // only revealed to the submitting player before round ends
};

// One entry in the round-end leaderboard broadcast.
export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  score: number; // cumulative score so far
};

// Payload for the round_finished broadcast.
export type RoundFinishedPayload = {
  roundNumber: number;
  correctAnswer: string;
  submissions: Pick<SubmissionRecord, "playerId" | "correct" | "pointsEarned" | "placement">[];
  leaderboard: LeaderboardEntry[];
  isLastRound: boolean;
  nextRoundIn: number; // ms until new_question fires (0 if last round)
};

// Payload for the game_finished broadcast.
export type GameFinishedPayload = {
  finalLeaderboard: LeaderboardEntry[];
  winner: { playerId: string; username: string; score: number };
};
