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
};
