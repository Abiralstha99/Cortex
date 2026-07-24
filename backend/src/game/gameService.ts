/* This file will contain the game service logic 

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { Difficulty, WaitingRoom } from "./types.js";
import crypto from "crypto";
import { reserveRoomCode } from "./roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "./redisKeys.js";

const MIN_ROUNDS = 3;
const MAX_ROUNDS = 20;
const DEFAULT_ROUNDS = 10;
const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  hostUsername,
  difficulty,
  rounds = DEFAULT_ROUNDS,
}: {
  hostId: string;
  hostUsername: string;
  difficulty: Difficulty;
  rounds?: number;
}) {
  if (!hostId) {
    throw new Error("Host user ID is required");
  }

  if (!hostUsername) {
    throw new Error("Host username is required");
  }

  if (!rounds || rounds < MIN_ROUNDS || rounds > MAX_ROUNDS) {
    throw new Error(
      `rounds must be an integer between ${MIN_ROUNDS} and ${MAX_ROUNDS}`,
    );
  }
  const gameId = crypto.randomUUID();

  // Now first reverse the room code for game
  const roomCode = await reserveRoomCode(gameId);

  // Now we need to create a waiting room, with the host seeded as the first player.
  const game: WaitingRoom = {
    gameId,
    difficulty,
    numberOfRounds: rounds,
    players: [{ id: hostId, username: hostUsername, ready: false }],
    status: "waiting",
    hostId,
    roomCode,
    createdAt: new Date(),
  };
  try {
    // Redis hash fields are flat strings, so the `players` object array has to
    // be JSON-encoded — a raw array would be coerced to "[object Object]".
    // Readers must JSON.parse it back.
    await redis
      .multi()
      .hset(GAME_KEY(gameId), {
        ...game,
        players: JSON.stringify(game.players),
      })
      .expire(GAME_KEY(gameId), WAITING_ROOM_EXPIRATION_TIME)
      .exec();
    console.log(`Waiting room created for game ${gameId}`);
    return game;
  } catch (error) {
    throw new Error("Unable to create game room", { cause: error });
  }
}
