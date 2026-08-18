import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import {
  GAME_KEY,
  ROOM_CODE_KEY,
} from "../../lib/redisKeys.js";
import { leaveWaitingGame } from "../lobby.service.js";

const GAME_ID = "33333333-3333-3333-3333-333333333333";
const ROOM_CODE = "ABC123";

beforeEach(async () => {
  await redis.del(GAME_KEY(GAME_ID), ROOM_CODE_KEY(ROOM_CODE));
});

after(async () => {
  await redis.del(GAME_KEY(GAME_ID), ROOM_CODE_KEY(ROOM_CODE));
  await redis.quit();
});

describe("public waiting room cleanup", () => {
  it("allows the last player to leave when unindexing fails", async (t) => {
    const consoleError = t.mock.method(console, "error", () => {});
    t.mock.method(redis, "zrem", async () => {
      throw new Error("Redis unavailable");
    });
    await redis.set(ROOM_CODE_KEY(ROOM_CODE), GAME_ID);
    await redis.hset(GAME_KEY(GAME_ID), {
      players: JSON.stringify([
        {
          id: "host-1",
          username: "alice",
          ready: false,
          score: 0,
        },
      ]),
      status: "waiting",
      hostId: "host-1",
    });

    const result = await leaveWaitingGame(ROOM_CODE, "host-1");

    assert.deepEqual(result, { game: null, leftPlayerId: "host-1" });
    assert.equal(consoleError.mock.callCount(), 1);
  });
});
