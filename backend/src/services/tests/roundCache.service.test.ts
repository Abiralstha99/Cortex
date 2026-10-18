import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { GAME_KEY, QUIZ_QUESTIONS_KEY, ROUND_KEY } from "../../lib/redisKeys.js";
import { getQuizQuestions } from "../quizCache.service.js";
import { startRound } from "../round.service.js";
import { applyScoresToGameState } from "../roundEnd.service.js";

const quizId = randomUUID();
const firstId = randomUUID();
const secondId = randomUUID();
const gameA = randomUUID();
const gameB = randomUUID();
const questions = [
  { id: firstId, question: "First question", type: "MCQ", content: { options: ["A", "B", "C", "D"], correctIndex: 1 }, explanation: "First explanation" },
  { id: secondId, question: "Second question", type: "TRUE_FALSE", content: { correctAnswer: false }, explanation: "Second explanation" },
];

after(async () => {
  await redis.del(QUIZ_QUESTIONS_KEY(quizId), GAME_KEY(gameA), GAME_KEY(gameB), ROUND_KEY(gameA), ROUND_KEY(gameB));
  await redis.quit();
});

describe("cached round advancement", () => {
  it("uses independent orders for games sharing a quiz and advances each game once", async () => {
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));
    const snapshot = await getQuizQuestions(quizId, async () => questions);
    for (const [gameId, order] of [[gameA, [firstId, secondId]], [gameB, [secondId, firstId]]] as const) {
      await redis.hset(GAME_KEY(gameId), {
        gameId, quizId, status: "playing", numberOfRounds: "2", currentRound: "0",
        currentQuestionIndex: "-1", questionOrder: JSON.stringify(order), quizVersion: snapshot.version,
      });
    }

    const [a, b] = await Promise.all([startRound(gameA, 0), startRound(gameB, 0)]);
    assert.equal(a?.questionId, firstId);
    assert.equal(b?.questionId, secondId);
    assert.equal(JSON.parse((await redis.hgetall(ROUND_KEY(gameA))).content!).correctIndex, 1);
    assert.equal((await redis.hgetall(ROUND_KEY(gameB))).type, "TRUE_FALSE");

    const duplicates = await Promise.all([startRound(gameA, 0), startRound(gameA, 0)]);
    assert.deepEqual(duplicates, [null, null]);
    assert.equal((await redis.hgetall(GAME_KEY(gameA))).currentRound, "1");
    assert.equal((await redis.hgetall(GAME_KEY(gameB))).currentRound, "1");

    const [nextA, nextB] = await Promise.all([startRound(gameA, 1), startRound(gameB, 1)]);
    assert.equal(nextA?.questionId, secondId);
    assert.equal(nextB?.questionId, firstId);
    assert.equal((await redis.hgetall(GAME_KEY(gameA))).currentQuestionIndex, "1");
    assert.equal((await redis.hgetall(GAME_KEY(gameB))).currentQuestionIndex, "1");
  });

  it("applies a round's scores only once when round end is retried", async () => {
    await redis.hset(GAME_KEY(gameA), {
      players: JSON.stringify([{ id: "player-1", username: "Ada", ready: true, score: 0 }]),
    });
    await redis.hset(GAME_KEY(gameB), {
      players: JSON.stringify([{ id: "player-2", username: "Bo", ready: true, score: 0 }]),
    });

    await Promise.all(Array.from({ length: 8 }, () =>
      applyScoresToGameState(gameA, [{ playerId: "player-1", points: 100 }], 1)));
    await applyScoresToGameState(gameB, [{ playerId: "player-2", points: 60 }], 1);

    const game = await redis.hgetall(GAME_KEY(gameA));
    assert.equal(JSON.parse(game.players!)[0].score, 100);
    assert.equal(JSON.parse((await redis.hgetall(GAME_KEY(gameB))).players!)[0].score, 60);
  });
});
