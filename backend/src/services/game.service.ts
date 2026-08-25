/* This file will contain the game service logic

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { QuizGenStatus, WaitingRoom } from "../types/room.types.js";
import crypto from "crypto";
import { reserveRoomCode } from "../lib/roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";
import { assertQuizPlayableForHost, capRoundsToQuiz } from "./gamePlay.helpers.js";
import { queuePublicIndex } from "./publicWaitingFeed.service.js";

const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  hostUsername,
  quizId,
  rounds,
  maxPlayers,
  isPublic = false,
}: {
  hostId: string;
  hostUsername: string;
  quizId?: string;
  rounds: number;
  maxPlayers: number;
  isPublic?: boolean;
}) {
  if (!hostId) {
    throw new Error("Host user ID is required");
  }

  if (!hostUsername) {
    throw new Error("Host username is required");
  }

  let resolvedQuizId: string | null = null;
  let numberOfRounds = rounds;
  let quizGenStatus: QuizGenStatus = "processing";

  if (quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, ownerId: true, questionCount: true, status: true },
    });
    assertQuizPlayableForHost(quiz, hostId);
    resolvedQuizId = quiz.id;
    numberOfRounds = capRoundsToQuiz(rounds, quiz.questionCount);
    quizGenStatus = "ready";
  }

  const gameId = crypto.randomUUID();
  const roomCode = await reserveRoomCode(gameId);

  const game: WaitingRoom = {
    gameId,
    quizId: resolvedQuizId,
    quizGenStatus,
    quizGenJobId: null,
    quizGenError: null,
    isPublic,
    numberOfRounds,
    maxPlayers,
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
    const transaction = redis
      .multi()
      .hset(GAME_KEY(gameId), {
        gameId: game.gameId,
        quizId: game.quizId ?? "",
        quizGenStatus: game.quizGenStatus,
        quizGenJobId: "",
        quizGenError: "",
        isPublic: game.isPublic ? "1" : "0",
        numberOfRounds: String(game.numberOfRounds),
        maxPlayers: String(game.maxPlayers),
        players: JSON.stringify(game.players),
        status: game.status,
        hostId: game.hostId,
        roomCode: game.roomCode,
        createdAt: game.createdAt.toISOString(),
      })
      .expire(GAME_KEY(gameId), WAITING_ROOM_EXPIRATION_TIME);

    if (game.isPublic) {
      queuePublicIndex(transaction, game.gameId, game.createdAt.getTime());
    }

    await transaction.exec();
    console.log(`Waiting room created for game ${gameId}`);
    return game;
  } catch (error) {
    throw new Error("Unable to create game room", { cause: error });
  }
}
