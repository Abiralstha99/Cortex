import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { GAME_KEY, PUBLIC_WAITING_ZSET } from "../../lib/redisKeys.js";
import { createWaitingGame } from "../game.service.js";

beforeEach(async () => {
  await redis.del(PUBLIC_WAITING_ZSET);
});

after(async () => {
  await redis.del(PUBLIC_WAITING_ZSET);
  await redis.quit();
});

describe("createWaitingGame public index", () => {
  // ESM exports are non-configurable, so we cannot spy on queuePublicIndex.
  // Contract: public create lands in the ZSET via MULTI (not standalone redis.zadd).
  // Sole production caller of queuePublicIndex is enforced by call-site grep (Task 3).

  it("persists and indexes a newly created public waiting room via MULTI indexer", async (t) => {
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
      await redis.zrem(PUBLIC_WAITING_ZSET, game.gameId);
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

  it("persists but does not index a newly created private waiting room", async (t) => {
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
  });
});
