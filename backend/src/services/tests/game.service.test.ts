import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET } from "../../lib/redisKeys.js";
import {
  createWaitingGame,
  indexPublicWaitingRoom,
  listPublicWaitingRooms,
  unindexPublicWaitingRoom,
  publicWaitingSummaryFromRoom,
  getPublicWaitingSummary,
} from "../game.service.js";

const GAME_A = "11111111-1111-1111-1111-111111111111";
const GAME_B = "22222222-2222-2222-2222-222222222222";

async function seedWaitingGame(
  gameId: string,
  opts: { isPublic: boolean; status?: string },
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
    createdAt: new Date("2026-08-16T12:00:00.000Z").toISOString(),
  });
}

beforeEach(async () => {
  await redis.del(PUBLIC_WAITING_ZSET, GAME_KEY(GAME_A), GAME_KEY(GAME_B));
});

after(async () => {
  await redis.del(PUBLIC_WAITING_ZSET, GAME_KEY(GAME_A), GAME_KEY(GAME_B));
  await redis.quit();
});

describe("public waiting index helpers", () => {
  it("persists and indexes a newly created public waiting room", async (t) => {
    const directZadd = t.mock.method(redis, "zadd");
    const game = await createWaitingGame({
      hostId: "host-1",
      hostUsername: "alice",
      rounds: 5,
      maxPlayers: 4,
      isPublic: true,
    });
    t.after(async () => {
      await redis.del(GAME_KEY(game.gameId));
      await unindexPublicWaitingRoom(game.gameId);
    });

    const raw = await redis.hgetall(GAME_KEY(game.gameId));
    assert.equal(game.isPublic, true);
    assert.equal(raw.isPublic, "1");
    assert.equal(
      await redis.zscore(PUBLIC_WAITING_ZSET, game.gameId),
      String(game.createdAt.getTime()),
    );
    assert.equal(directZadd.mock.callCount(), 0);
  });

  it(
    "persists but does not index a newly created private waiting room",
    async (t) => {
      const game = await createWaitingGame({
        hostId: "host-1",
        hostUsername: "alice",
        rounds: 5,
        maxPlayers: 4,
      });
      t.after(async () => {
        await redis.del(GAME_KEY(game.gameId));
      });

      const raw = await redis.hgetall(GAME_KEY(game.gameId));
      assert.equal(game.isPublic, false);
      assert.equal(raw.isPublic, "0");
      assert.equal(await redis.zscore(PUBLIC_WAITING_ZSET, game.gameId), null);
    },
  );

  it("lists newest public waiting rooms and skips private ones", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true });
    await seedWaitingGame(GAME_B, { isPublic: false });
    await indexPublicWaitingRoom(GAME_A, Date.parse("2026-08-16T12:00:00.000Z"));
    await indexPublicWaitingRoom(GAME_B, Date.parse("2026-08-16T13:00:00.000Z"));

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 1);
    assert.equal(rooms[0]!.gameId, GAME_A);
    assert.equal(rooms[0]!.hostUsername, "alice");
    assert.equal(rooms[0]!.playerCount, 1);
  });

  it("prunes stale zset members whose game is gone or no longer waiting", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true, status: "playing" });
    await indexPublicWaitingRoom(GAME_A, Date.now());
    await indexPublicWaitingRoom(GAME_B, Date.now()); // never seeded → missing

    const rooms = await listPublicWaitingRooms();
    assert.equal(rooms.length, 0);
    assert.equal(await redis.zcard(PUBLIC_WAITING_ZSET), 0);
  });

  it("unindexPublicWaitingRoom removes the member", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true });
    await indexPublicWaitingRoom(GAME_A, Date.now());
    await unindexPublicWaitingRoom(GAME_A);
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

  it("returns a summary for a public waiting room", async () => {
    await seedWaitingGame(GAME_A, { isPublic: true });
    const summary = await getPublicWaitingSummary(GAME_A);
    assert.equal(summary?.gameId, GAME_A);
    assert.equal(summary?.hostUsername, "alice");
    assert.equal(summary?.playerCount, 1);
  });
});

