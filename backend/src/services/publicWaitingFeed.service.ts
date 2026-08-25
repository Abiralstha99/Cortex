import type { ChainableCommander } from "ioredis";
import type { Server } from "socket.io";
import type {
  PublicWaitingRoomSummary,
  QuizGenStatus,
  WaitingRoom,
} from "../types/room.types.js";
import redis from "../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET } from "../lib/redisKeys.js";
import {
  emitPublicRoomRemoved,
  emitSaveAsPublic,
} from "../socket/publicWaiting.js";

export function queuePublicIndex(
  transaction: ChainableCommander,
  gameId: string,
  createdAtMs: number,
): void {
  transaction.zadd(PUBLIC_WAITING_ZSET, createdAtMs, gameId);
}

export function publicWaitingSummaryFromRoom(
  game: WaitingRoom,
): PublicWaitingRoomSummary {
  const host =
    game.players.find((player) => player.id === game.hostId) ??
    game.players[0] ??
    null;
  return {
    gameId: game.gameId,
    roomCode: game.roomCode,
    hostId: game.hostId,
    hostUsername: host?.username ?? "Host",
    playerCount: game.players.length,
    maxPlayers: game.maxPlayers,
    numberOfRounds: game.numberOfRounds,
    quizGenStatus: game.quizGenStatus,
    createdAt:
      game.createdAt instanceof Date
        ? game.createdAt.toISOString()
        : String(game.createdAt),
  };
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
    if (!raw?.gameId || raw.status !== "waiting" || raw.isPublic !== "1") {
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

export async function getPublicWaitingSummary(
  gameId: string,
): Promise<PublicWaitingRoomSummary | null> {
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw?.gameId || raw.status !== "waiting" || raw.isPublic !== "1") {
    return null;
  }
  const players = JSON.parse(raw.players ?? "[]") as Array<{
    id: string;
    username: string;
    ready?: boolean;
    score?: number;
  }>;
  return publicWaitingSummaryFromRoom({
    gameId: raw.gameId,
    quizId: raw.quizId?.trim() ? raw.quizId : null,
    quizGenStatus: (raw.quizGenStatus as QuizGenStatus) || "none",
    quizGenJobId: raw.quizGenJobId?.trim() ? raw.quizGenJobId : null,
    quizGenError: raw.quizGenError?.trim() ? raw.quizGenError : null,
    isPublic: true,
    players: players.map((p) => ({
      id: p.id,
      username: p.username,
      ready: Boolean(p.ready),
      score: Number(p.score ?? 0),
    })),
    status: "waiting",
    hostId: raw.hostId!,
    roomCode: raw.roomCode!,
    createdAt: new Date(raw.createdAt!),
    numberOfRounds: Number(raw.numberOfRounds || 0),
    maxPlayers: Number(raw.maxPlayers || 8),
  });
}

function safeEmitUpsert(io: Server, summary: PublicWaitingRoomSummary): void {
  try {
    emitSaveAsPublic(io, summary);
  } catch (error) {
    console.error(
      `Failed to broadcast save_as_public for ${summary.gameId}`,
      error,
    );
  }
}

export function announcePublicWaitingUpsert(
  io: Server,
  room: WaitingRoom,
): void {
  if (!room.isPublic) return;
  safeEmitUpsert(io, publicWaitingSummaryFromRoom(room));
}

export function refreshPublicWaitingRoom(io: Server, gameId: string): void {
  void getPublicWaitingSummary(gameId)
    .then((summary) => {
      if (summary) {
        safeEmitUpsert(io, summary);
      }
    })
    .catch((error) => {
      console.error(
        `Failed to broadcast public quiz status for ${gameId}`,
        error,
      );
    });
}

export async function retractPublicWaitingRoom(
  io: Server,
  input: { gameId: string; wasPublic: boolean },
): Promise<void> {
  if (!input.wasPublic) return;
  try {
    await unindexPublicWaitingRoom(input.gameId);
  } catch (error) {
    console.error(
      `Failed to unindex public waiting room ${input.gameId}`,
      error,
    );
  }
  try {
    emitPublicRoomRemoved(io, input.gameId);
  } catch (error) {
    console.error(
      `Failed to broadcast public_room_removed for ${input.gameId}`,
      error,
    );
  }
}
