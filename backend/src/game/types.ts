// This file defines the types for the waiting room and game room

export type Difficulty = "Easy" | "Medium" | "Hard";
export type GameStatus = "waiting" | "playing" | "finished" | "cancelled";

export type WaitingRoom = {
  gameId: string;
  difficulty: Difficulty;
  players: string[];
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
