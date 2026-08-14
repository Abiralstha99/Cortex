import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import redis from "../../lib/redis.js";
import { GAME_KEY } from "../../lib/redisKeys.js";
import {
  attachQuizToWaitingGame,
  markWaitingQuizFailed,
  setWaitingQuizFields,
} from "../waitingQuiz.service.js";

const gameId = crypto.randomUUID();
const gameKey = GAME_KEY(gameId);

beforeEach(async () => {
  await redis.del(gameKey);
});

after(async () => {
  await redis.del(gameKey);
  await redis.quit();
});

describe("waiting quiz writes", () => {
  it("does not recreate a missing room", async () => {
    const updated = await setWaitingQuizFields(gameId, {
      quizGenStatus: "failed",
    });

    assert.equal(updated, false);
    assert.equal(await redis.exists(gameKey), 0);
  });

  it("does not mutate a room that is no longer waiting", async () => {
    await redis.hset(gameKey, {
      gameId,
      status: "playing",
      quizGenStatus: "processing",
    });

    const updated = await setWaitingQuizFields(gameId, {
      quizGenStatus: "failed",
    });

    assert.equal(updated, false);
    assert.equal(await redis.hget(gameKey, "quizGenStatus"), "processing");
  });

  it("updates an existing waiting room", async () => {
    await redis.hset(gameKey, {
      gameId,
      status: "waiting",
      quizGenStatus: "processing",
    });

    const updated = await setWaitingQuizFields(gameId, {
      quizGenStatus: "failed",
    });

    assert.equal(updated, true);
    assert.equal(await redis.hget(gameKey, "quizGenStatus"), "failed");
  });

  it("quietly ignores failure updates after a room disappears", async () => {
    const payload = await markWaitingQuizFailed(gameId, "Upload failed");

    assert.equal(payload, null);
    assert.equal(await redis.exists(gameKey), 0);
  });

  it("rejects attaching a quiz after the room starts", async () => {
    await redis.hset(gameKey, {
      gameId,
      status: "playing",
      numberOfRounds: "10",
    });

    await assert.rejects(
      attachQuizToWaitingGame(gameId, crypto.randomUUID(), 5),
      /Room is not waiting/,
    );
  });
});
