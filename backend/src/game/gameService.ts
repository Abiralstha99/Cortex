/* This file will contain the game service logic 

It creates a REDIS waiting game lobby for the host.
*/

import type { Difficulty } from "./types.js";
import crypto from "crypto";
import { reserveRoomCode } from "./roomCode.js";
import type { WaitingRoom } from "./types.js";
import redis from "../lib/redis.js";
import { WAITING_ROOM_KEY } from "./redisKeys.js";

const MIN_ROUNDS = 3;
const MAX_ROUNDS = 20;
const DEFAULT_ROUNDS = 10;
const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  difficulty,
  rounds = DEFAULT_ROUNDS,
}: {
  hostId: string;
  difficulty: Difficulty;
  rounds?: number;
}) {
  if (!hostId) {
    throw new Error("Host user ID is required");
  }

  if (!rounds || rounds < MIN_ROUNDS || rounds > MAX_ROUNDS) {
    throw new Error(
      `rounds must be an integer between ${MIN_ROUNDS} and ${MAX_ROUNDS}`,
    );
  }
  const gameId = crypto.randomUUID();

  // Now first reverse the room code for game
  const roomCode = await reserveRoomCode(gameId);

  // Now we need to create a waiting room
  const game: WaitingRoom = {
    gameId,
    difficulty,
    numberOfRounds: rounds,
    players: [hostId],
    status: "waiting",
    hostId,
    roomCode,
    createdAt: new Date(),
  };
  try {
    await redis
      .multi()
      .hset(WAITING_ROOM_KEY(gameId), game)
      .expire(WAITING_ROOM_KEY(gameId), WAITING_ROOM_EXPIRATION_TIME)
      .exec();
    console.log(`Waiting room created for game ${gameId}`);
    return game;
  } catch (error) {
    throw new Error("Unable to create game room", { cause: error });
  }
}
