import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { CORRECT_COUNT_KEY, ROUND_ENDED_KEY, ROUND_KEY, SUBMISSION_KEY } from "../../lib/redisKeys.js";
import { submitAnswer } from "../answer.service.js";

const gameId = randomUUID();
const questionId = randomUUID();
const playerId = randomUUID();

async function setRound(type: string, content: object) {
  await redis.del(ROUND_KEY(gameId), CORRECT_COUNT_KEY(gameId, 1), ROUND_ENDED_KEY(gameId, 1), SUBMISSION_KEY(gameId, 1, playerId));
  await redis.hset(ROUND_KEY(gameId), {
    roundNumber: "1", questionId, type, content: JSON.stringify(content),
    startedAt: new Date().toISOString(), submissionCount: "0",
  });
}

async function answer(value: number | boolean | string) {
  return submitAnswer({ gameId, roundNumber: 1, questionId, playerId,
    answer: value, responseTime: 0, totalPlayers: 2 });
}

after(async () => {
  await redis.del(ROUND_KEY(gameId), CORRECT_COUNT_KEY(gameId, 1), ROUND_ENDED_KEY(gameId, 1), SUBMISSION_KEY(gameId, 1, playerId));
  await redis.quit();
});

describe("typed answer submission", () => {
  it("grades true/false, records a boolean, and rejects a duplicate", async () => {
    await setRound("TRUE_FALSE", { correctAnswer: false });
    const result = await answer(false);
    assert.equal(result.result.correct, true);
    assert.equal(result.result.pointsEarned, 100);
    assert.equal(result.result.correctAnswer, false);
    assert.equal(JSON.parse((await redis.get(SUBMISSION_KEY(gameId, 1, playerId)))!).answer, false);
    await assert.rejects(answer(true), /already submitted/);
  });

  it("accepts a second blank spelling after whitespace and case normalization", async () => {
    await setRound("FILL_BLANK", { acceptedAnswers: ["New York", "NYC"] });
    const result = await answer("  nYc  ");
    assert.equal(result.result.correct, true);
    assert.equal(result.result.correctAnswer, "New York / NYC");
    assert.equal(JSON.parse((await redis.get(SUBMISSION_KEY(gameId, 1, playerId)))!).answer, "  nYc  ");
  });

  it("rejects a value of the wrong type before writing a submission", async () => {
    await setRound("MCQ", { options: ["A", "B", "C", "D"], correctIndex: 2 });
    await assert.rejects(answer("C"), /type does not match/);
    assert.equal(await redis.get(SUBMISSION_KEY(gameId, 1, playerId)), null);
    const result = await answer(2);
    assert.equal(result.result.correct, true);
    assert.equal(result.result.correctAnswer, 2);
    const stored = JSON.parse((await redis.get(SUBMISSION_KEY(gameId, 1, playerId)))!);
    assert.equal(stored.pointsEarned, 100);
    assert.equal(stored.correctAnswer, 2);
  });

  it("accepts exactly one of two concurrent submissions with a complete score", async () => {
    await setRound("MCQ", { options: ["A", "B", "C", "D"], correctIndex: 2 });
    const outcomes = await Promise.allSettled([answer(2), answer(1)]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    const stored = JSON.parse((await redis.get(SUBMISSION_KEY(gameId, 1, playerId)))!);
    assert.equal(typeof stored.correct, "boolean");
    assert.equal(typeof stored.pointsEarned, "number");
    assert.equal(stored.correctAnswer, 2);
  });

  it("rejects a submission after the round-end claim", async () => {
    await setRound("TRUE_FALSE", { correctAnswer: true });
    await redis.set(ROUND_ENDED_KEY(gameId, 1), "1");
    await assert.rejects(answer(true), /Stale submission/);
    assert.equal(await redis.get(SUBMISSION_KEY(gameId, 1, playerId)), null);
  });
});
