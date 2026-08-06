/* This file will contain the game service logic 

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { Difficulty, WaitingRoom } from "../types/room.types.js";
import crypto from "crypto";
import { reserveRoomCode } from "../lib/roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";

const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  hostUsername,
  difficulty,
  rounds,
}: {
  hostId: string;
  hostUsername: string;
  difficulty: Difficulty;
  rounds: number;
}) {
  if (!hostId) {
    throw new Error("Host user ID is required");
  }

  if (!hostUsername) {
    throw new Error("Host username is required");
  }

  const gameId = crypto.randomUUID();

  // Now first reverse the room code for game
  const roomCode = await reserveRoomCode(gameId);

  // Now we need to create a waiting room, with the host seeded as the first player.
  const game: WaitingRoom = {
    gameId,
    difficulty,
    numberOfRounds: rounds,
    players: [{ id: hostId, username: hostUsername, ready: false, score: 0 }],
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
