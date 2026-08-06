/* This file will contain the game service logic

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { WaitingRoom } from "../types/room.types.js";
import crypto from "crypto";
import { reserveRoomCode } from "../lib/roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";

const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  hostUsername,
  quizId,
  rounds,
}: {
  hostId: string;
  hostUsername: string;
  quizId: string;
  rounds: number;
}) {
  if (!hostId) {
    throw new Error("Host user ID is required");
  }

  if (!hostUsername) {
    throw new Error("Host username is required");
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, questionCount: true },
  });
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Cap rounds to quiz size so pickQuestion cannot exhaust the pool mid-game.
  const numberOfRounds = Math.min(rounds, quiz.questionCount);
  if (numberOfRounds < 1) {
    throw new Error("Quiz has no questions");
  }

  const gameId = crypto.randomUUID();
  const roomCode = await reserveRoomCode(gameId);

  const game: WaitingRoom = {
    gameId,
    quizId: quiz.id,
    numberOfRounds,
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
        gameId: game.gameId,
        quizId: game.quizId,
        numberOfRounds: String(game.numberOfRounds),
        players: JSON.stringify(game.players),
        status: game.status,
        hostId: game.hostId,
        roomCode: game.roomCode,
        createdAt: game.createdAt.toISOString(),
      })
      .expire(GAME_KEY(gameId), WAITING_ROOM_EXPIRATION_TIME)
      .exec();
    console.log(`Waiting room created for game ${gameId}`);
    return game;
  } catch (error) {
    throw new Error("Unable to create game room", { cause: error });
  }
}
