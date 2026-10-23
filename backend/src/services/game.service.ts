/* This file will contain the game service logic

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { QuizGenStatus, WaitingRoom } from "../types/room.types.js";
import crypto from "crypto";
import { reserveRoomCode } from "../lib/roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET, ROOM_CODE_KEY } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";
import { lockQuizRow } from "./quiz/quizRowLock.js";
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

  if (quizId) {
    let pendingRoom: { gameId: string; roomCode: string } | null = null;
    try {
      return await prisma.$transaction(async (tx) => {
        if (!await lockQuizRow(tx, quizId)) throw new Error("Quiz not found");
        const quiz = await tx.quiz.findUnique({
          where: { id: quizId },
          select: { id: true, ownerId: true, questionCount: true, status: true, classification: true },
        });
        assertQuizPlayableForHost(quiz, hostId);
        return writeWaitingRoom(quiz.id, capRoundsToQuiz(rounds, quiz.questionCount), "ready", (room) => { pendingRoom = room; });
      }, { timeout: 15000 });
    } catch (error) {
      if (pendingRoom) await removeUncommittedRoom(pendingRoom);
      throw error;
    }
  }
  return writeWaitingRoom(null, rounds, "processing");

  async function writeWaitingRoom(resolvedQuizId: string | null, numberOfRounds: number, quizGenStatus: QuizGenStatus, onReserved?: (room: { gameId: string; roomCode: string }) => void) {
    const gameId = crypto.randomUUID();
    const roomCode = await reserveRoomCode(gameId);
    onReserved?.({ gameId, roomCode });

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
}

async function removeUncommittedRoom({ gameId, roomCode }: { gameId: string; roomCode: string }) {
  await redis.eval(`
    if redis.call("GET", KEYS[1]) == ARGV[1] then redis.call("DEL", KEYS[1]) end
    if redis.call("HGET", KEYS[2], "gameId") == ARGV[1] then redis.call("DEL", KEYS[2]) end
    redis.call("ZREM", KEYS[3], ARGV[1])
    return 1
  `, 3, ROOM_CODE_KEY(roomCode), GAME_KEY(gameId), PUBLIC_WAITING_ZSET, gameId);
}
