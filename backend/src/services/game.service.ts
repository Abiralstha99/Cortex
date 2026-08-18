/* This file will contain the game service logic

It creates a REDIS waiting game lobby and adds the host as the first player.
*/

import type { QuizGenStatus, WaitingRoom } from "../types/room.types.js";
import crypto from "crypto";
import { reserveRoomCode } from "../lib/roomCode.js";
import redis from "../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";
import { assertQuizPlayableForHost, capRoundsToQuiz } from "./gamePlay.helpers.js";

const WAITING_ROOM_EXPIRATION_TIME = 60 * 60; // 1 hour

export async function createWaitingGame({
  hostId,
  hostUsername,
  quizId,
  rounds,
  maxPlayers,
}: {
  hostId: string;
  hostUsername: string;
  quizId?: string;
  rounds: number;
  maxPlayers: number;
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
    await redis
      .multi()
      .hset(GAME_KEY(gameId), {
        gameId: game.gameId,
        quizId: game.quizId ?? "",
        quizGenStatus: game.quizGenStatus,
        quizGenJobId: "",
        quizGenError: "",
        numberOfRounds: String(game.numberOfRounds),
        maxPlayers: String(game.maxPlayers),
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

// --- Public waiting index helpers (Task 1) ---
export type PublicWaitingRoomSummary = {
  gameId: string;
  roomCode: string;
  hostId: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  numberOfRounds: number;
  quizGenStatus: QuizGenStatus;
  createdAt: string;
};

export async function indexPublicWaitingRoom(
  gameId: string,
  createdAtMs: number,
): Promise<void> {
  await redis.zadd(PUBLIC_WAITING_ZSET, createdAtMs, gameId);
}

export async function unindexPublicWaitingRoom(gameId: string): Promise<void> {
  await redis.zrem(PUBLIC_WAITING_ZSET, gameId);
}

export async function listPublicWaitingRooms(): Promise<
  PublicWaitingRoomSummary[]
> {
  const ids = await redis.zrange(PUBLIC_WAITING_ZSET, 0, -1, "REV");
  const rooms: PublicWaitingRoomSummary[] = [];

  for (const gameId of ids) {
    const raw = await redis.hgetall(GAME_KEY(gameId));
    if (
      !raw?.gameId ||
      raw.status !== "waiting" ||
      raw.isPublic !== "1"
    ) {
      await unindexPublicWaitingRoom(gameId);
      continue;
    }

    const players = JSON.parse(raw.players ?? "[]") as Array<{
      id: string;
      username: string;
    }>;
    const host =
      players.find((p) => p.id === raw.hostId) ?? players[0] ?? null;

    rooms.push({
      gameId: raw.gameId,
      roomCode: raw.roomCode!,
      hostId: raw.hostId!,
      hostUsername: host?.username ?? "Host",
      playerCount: players.length,
      maxPlayers: Number(raw.maxPlayers || 8),
      numberOfRounds: Number(raw.numberOfRounds || 0),
      quizGenStatus: (raw.quizGenStatus as QuizGenStatus) || "none",
      createdAt: raw.createdAt!,
    });
  }

  return rooms;
}
