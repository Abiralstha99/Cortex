import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET } from "../../lib/redisKeys.js";
import type { WaitingRoom } from "../../types/room.types.js";
import {
  announcePublicWaitingUpsert,
  getPublicWaitingSummary,
  listPublicWaitingRooms,
  publicWaitingSummaryFromRoom,
  queuePublicIndex,
  retractPublicWaitingRoom,
} from "../publicWaitingFeed.service.js";

const GAME_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const GAME_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

async function seedWaitingGame(
  gameId: string,
  opts: { isPublic: boolean; status?: string; createdAt?: string },
) {
  await redis.hset(GAME_KEY(gameId), {
    gameId,
    roomCode: gameId.slice(0, 6).toUpperCase(),
    hostId: "host-1",
    quizId: "",
    quizGenStatus: "ready",
    quizGenJobId: "",
    quizGenError: "",
    numberOfRounds: "10",
    maxPlayers: "8",
    players: JSON.stringify([
      { id: "host-1", username: "alice", ready: false, score: 0 },
    ]),
    status: opts.status ?? "waiting",
    isPublic: opts.isPublic ? "1" : "0",
    createdAt:
      opts.createdAt ?? new Date("2026-08-16T12:00:00.000Z").toISOString(),
  });
}

function sampleRoom(overrides: Partial<WaitingRoom> = {}): WaitingRoom {
  return {
    gameId: GAME_A,
    quizId: null,
    quizGenStatus: "ready",
    quizGenJobId: null,
    quizGenError: null,
    isPublic: true,
    players: [{ id: "host-1", username: "alice", ready: false, score: 0 }],
    status: "waiting",
    hostId: "host-1",
    roomCode: "ABCDEF",
    createdAt: new Date("2026-08-16T12:00:00.000Z"),
    numberOfRounds: 10,
    maxPlayers: 8,
    ...overrides,
  };
}

function mockIo() {
  const saveAsPublic: unknown[] = [];
  const publicRoomRemoved: string[] = [];
  const io = {
    to: (_room: string) => ({
      emit: (event: string, payload: unknown) => {
        if (event === "save_as_public") {
          saveAsPublic.push(payload);
        }
        if (event === "public_room_removed") {
          publicRoomRemoved.push((payload as { gameId: string }).gameId);
        }
      },
    }),
  } as import("socket.io").Server;
  return { io, saveAsPublic, publicRoomRemoved };
}

beforeEach(async () => {
  await redis.del(
    PUBLIC_WAITING_ZSET,
    GAME_KEY(GAME_A),
    GAME_KEY(GAME_B),
  );
});

after(async () => {
  await redis.del(
    PUBLIC_WAITING_ZSET,
    GAME_KEY(GAME_A),
    GAME_KEY(GAME_B),
  );
  await redis.quit();
});

describe("publicWaitingFeed policy", () => {
  it("announcePublicWaitingUpsert skips private rooms", () => {
    const { io, saveAsPublic } = mockIo();
    announcePublicWaitingUpsert(io, sampleRoom({ isPublic: false }));
    assert.equal(saveAsPublic.length, 0);
  });

  it("announcePublicWaitingUpsert emits summary for public rooms", () => {
    const { io, saveAsPublic } = mockIo();
    announcePublicWaitingUpsert(io, sampleRoom({ isPublic: true }));
    assert.equal(saveAsPublic.length, 1);
    assert.equal((saveAsPublic[0] as { gameId: string }).gameId, GAME_A);
    assert.equal((saveAsPublic[0] as { playerCount: number }).playerCount, 1);
  });

  it("retractPublicWaitingRoom no-ops when wasPublic is false", async () => {
    const { io, publicRoomRemoved } = mockIo();
    await redis.zadd(PUBLIC_WAITING_ZSET, Date.now(), GAME_A);
    await retractPublicWaitingRoom(io, { gameId: GAME_A, wasPublic: false });
    assert.equal(publicRoomRemoved.length, 0);
    assert.notEqual(await redis.zscore(PUBLIC_WAITING_ZSET, GAME_A), null);
  });

  it("retractPublicWaitingRoom unindexes and emits when wasPublic", async () => {
    const { io, publicRoomRemoved } = mockIo();
    await redis.zadd(PUBLIC_WAITING_ZSET, Date.now(), GAME_A);
    await retractPublicWaitingRoom(io, { gameId: GAME_A, wasPublic: true });
    assert.equal(await redis.zscore(PUBLIC_WAITING_ZSET, GAME_A), null);
    assert.equal(publicRoomRemoved.length, 1);
    assert.equal(publicRoomRemoved[0], GAME_A);
  });

  it("queuePublicIndex adds member inside a MULTI", async () => {
    const tx = redis.multi();
    queuePublicIndex(tx, GAME_A, Date.parse("2026-08-16T12:00:00.000Z"));
    await tx.exec();
    assert.equal(
      await redis.zscore(PUBLIC_WAITING_ZSET, GAME_A),
      String(Date.parse("2026-08-16T12:00:00.000Z")),
    );
  });

  it("listPublicWaitingRooms returns newest-first and skips private rooms", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true });
    await seedWaitingGame(GAME_B, { isPublic: false });
    await redis.zadd(
      PUBLIC_WAITING_ZSET,
      Date.parse("2026-08-16T12:00:00.000Z"),
      GAME_A,
      Date.parse("2026-08-16T13:00:00.000Z"),
      GAME_B,
    );

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 1);
    assert.equal(rooms[0]!.gameId, GAME_A);
    assert.equal(rooms[0]!.hostUsername, "alice");
    assert.equal(rooms[0]!.playerCount, 1);
    assert.equal(await redis.zscore(PUBLIC_WAITING_ZSET, GAME_B), null);
  });

  it("listPublicWaitingRooms orders public waiting rooms newest-first", async () => {
    await seedWaitingGame(GAME_A, {
      isPublic: true,
      createdAt: new Date("2026-08-16T12:00:00.000Z").toISOString(),
    });
    await seedWaitingGame(GAME_B, {
      isPublic: true,
      createdAt: new Date("2026-08-16T13:00:00.000Z").toISOString(),
    });
    await redis.zadd(
      PUBLIC_WAITING_ZSET,
      Date.parse("2026-08-16T12:00:00.000Z"),
      GAME_A,
      Date.parse("2026-08-16T13:00:00.000Z"),
      GAME_B,
    );

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 2);
    assert.equal(rooms[0]!.gameId, GAME_B);
    assert.equal(rooms[1]!.gameId, GAME_A);
  });

  it("listPublicWaitingRooms prunes stale members", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true, status: "playing" });
    await redis.zadd(PUBLIC_WAITING_ZSET, Date.now(), GAME_A);
    await redis.zadd(PUBLIC_WAITING_ZSET, Date.now(), GAME_B);

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 0);
    assert.equal(await redis.zcard(PUBLIC_WAITING_ZSET), 0);
  });

  it("listPublicWaitingRooms is empty after retractPublicWaitingRoom", async () => {
    const { io } = mockIo();
    await seedWaitingGame(GAME_A, { isPublic: true });
    await redis.zadd(PUBLIC_WAITING_ZSET, Date.now(), GAME_A);

    await retractPublicWaitingRoom(io, { gameId: GAME_A, wasPublic: true });

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 0);
    assert.equal(await redis.zscore(PUBLIC_WAITING_ZSET, GAME_A), null);
  });
});

describe("publicWaitingSummaryFromRoom", () => {
  it("maps host username and player count from the waiting room", () => {
    const createdAt = new Date("2026-08-18T12:00:00.000Z");
    const summary = publicWaitingSummaryFromRoom({
      gameId: GAME_A,
      quizId: null,
      quizGenStatus: "ready",
      quizGenJobId: null,
      quizGenError: null,
      isPublic: true,
      players: [
        { id: "host-1", username: "alice", ready: true, score: 0 },
        { id: "p2", username: "bob", ready: false, score: 0 },
      ],
      status: "waiting",
      hostId: "host-1",
      roomCode: "ABCDEF",
      createdAt,
      numberOfRounds: 10,
      maxPlayers: 8,
    });
    assert.deepEqual(summary, {
      gameId: GAME_A,
      roomCode: "ABCDEF",
      hostId: "host-1",
      hostUsername: "alice",
      playerCount: 2,
      maxPlayers: 8,
      numberOfRounds: 10,
      quizGenStatus: "ready",
      createdAt: createdAt.toISOString(),
    });
  });
});

describe("getPublicWaitingSummary", () => {
  it("returns null for a private waiting room", async () => {
    await seedWaitingGame(GAME_A, { isPublic: false });
    assert.equal(await getPublicWaitingSummary(GAME_A), null);
  });

  it("returns null when the game hash is missing", async () => {
    assert.equal(await getPublicWaitingSummary(GAME_A), null);
  });

  it("returns a summary for a public waiting room", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true });
    const summary = await getPublicWaitingSummary(GAME_A);
    assert.equal(summary?.gameId, GAME_A);
    assert.equal(summary?.hostUsername, "alice");
    assert.equal(summary?.playerCount, 1);
  });
});
