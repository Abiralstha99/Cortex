import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { QUIZ_QUESTIONS_KEY } from "../../lib/redisKeys.js";
import { getQuizQuestions, shuffleQuestionIds } from "../quizCache.service.js";

const quizId = randomUUID();
const questions = Array.from({ length: 5 }, (_, index) => ({
  id: randomUUID(),
  question: `Question ${index}`,
  type: "MCQ",
  content: { options: ["A", "B", "C", "D"], correctIndex: index % 4 },
  explanation: "Explanation",
}));

after(async () => {
  await redis.del(QUIZ_QUESTIONS_KEY(quizId));
  await redis.quit();
});

describe("shared quiz question cache", () => {
  it("loads all questions once, reuses the shared cache, and sets a TTL", async () => {
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));
    let reads = 0;
    const loader = async () => { reads++; return questions; };

    const first = await getQuizQuestions(quizId, loader);
    const second = await getQuizQuestions(quizId, loader);

    assert.equal(reads, 1);
    assert.deepEqual(second, first);
    assert.ok((await redis.ttl(QUIZ_QUESTIONS_KEY(quizId))) > 0);
  });

  it("reloads a missing cache but refuses changed data for a pinned game", async () => {
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));
    const first = await getQuizQuestions(quizId, async () => questions);
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));

    await assert.rejects(
      getQuizQuestions(quizId, async () => [{ ...questions[0]!, question: "Changed" }, ...questions.slice(1)], first.version),
      /changed/i,
    );
  });

  it("reloads an unchanged snapshot after eviction for a pinned game", async () => {
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));
    const first = await getQuizQuestions(quizId, async () => questions);
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));

    const restored = await getQuizQuestions(quizId, async () => questions, first.version);
    assert.deepEqual(restored, first);
  });

  it("keeps one snapshot when cold starts race", async () => {
    await redis.del(QUIZ_QUESTIONS_KEY(quizId));
    const changed = [{ ...questions[0]!, question: "Another version" }, ...questions.slice(1)];
    const results = await Promise.all([
      getQuizQuestions(quizId, async () => questions),
      getQuizQuestions(quizId, async () => changed),
    ]);
    assert.equal(results[0]!.version, results[1]!.version);
    assert.deepEqual(results[0], results[1]);
  });

  it("shuffles without dropping or duplicating questions", () => {
    const order = shuffleQuestionIds(questions.map((question) => question.id));
    assert.deepEqual(new Set(order), new Set(questions.map((question) => question.id)));
    assert.equal(order.length, questions.length);
  });
});
