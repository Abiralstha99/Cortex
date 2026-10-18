import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { GAME_START_LOCK_KEY } from "../../lib/redisKeys.js";
import { acquireGameStartLock, releaseGameStartLock } from "../lobby.service.js";

const gameId = randomUUID();

after(async () => {
  await redis.del(GAME_START_LOCK_KEY(gameId));
  await redis.quit();
});

describe("game start claim", () => {
  it("allows one concurrent starter and allows a retry after release", async () => {
    const claims = await Promise.all(Array.from({ length: 8 }, () => acquireGameStartLock(gameId)));
    const winners = claims.filter((token): token is string => token !== null);
    assert.equal(winners.length, 1);
    assert.ok((await redis.ttl(GAME_START_LOCK_KEY(gameId))) > 0);

    await releaseGameStartLock(gameId, winners[0]!);
    const retry = await acquireGameStartLock(gameId);
    assert.ok(retry);
    await releaseGameStartLock(gameId, retry!);
  });
});
