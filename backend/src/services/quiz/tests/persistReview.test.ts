import assert from "node:assert/strict";
import { after, it } from "node:test";
import type { Prisma } from "../../../../app/generated/prisma/client.js";
import redis from "../../../lib/redis.js";
import { persistReadyQuiz, quizMetadataQuery, type ReadyQuizTransactionRunner } from "../persist.service.js";

after(() => redis.disconnect());

it("selects only owner-scoped, non-sensitive quiz metadata", () => {
  const query = quizMetadataQuery("quiz-1", "owner-1");
  assert.deepEqual(query.where, { id: "quiz-1", ownerId: "owner-1" });
  assert.deepEqual(Object.keys(query.select).sort(),
    ["createdAt", "id", "questionCount", "sourceType", "status", "title"].sort());
});

it("persists only cited chunks and distinct quotes with quiz and questions in one transaction", async () => {
  const calls: Array<{ model: string; args: unknown }> = [];
  let transactionCount = 0;
  const runner: ReadyQuizTransactionRunner = async (operation) => {
    transactionCount++;
    return operation({
      quiz: { create: async (args: unknown) => { calls.push({ model: "quiz", args }); return { id: "quiz-1", questionCount: 1 }; } },
      sourceChunk: { createMany: async (args: unknown) => { calls.push({ model: "chunk", args }); return { count: 1 }; } },
      question: { create: async (args: unknown) => { calls.push({ model: "question", args }); return {}; } },
    } as unknown as Prisma.TransactionClient);
  };
  const result = await persistReadyQuiz(runner, {
    ownerId: "owner-1", title: "Notes", sourceType: "text",
    chunks: ["Alpha supports the answer.", "Unused material."],
    questions: [{ type: "TRUE_FALSE", question: "Is Alpha supported?", content: { correctAnswer: true },
      explanation: "Alpha is explicitly supported.",
      sources: [{ chunkId: "chunk-1", quote: "Alpha supports" }, { chunkId: "chunk-1", quote: "Alpha supports" }] }],
  });
  assert.deepEqual(result, { id: "quiz-1", questionCount: 1 });
  assert.equal(transactionCount, 1);
  assert.deepEqual(calls.map((call) => call.model), ["quiz", "chunk", "question"]);
  assert.deepEqual((calls[1]!.args as { data: unknown }).data,
    [{ quizId: "quiz-1", chunkId: "chunk-1", text: "Alpha supports the answer." }]);
  const sources = (calls[2]!.args as { data: { sourceReferences: { create: unknown[] } } }).data.sourceReferences.create;
  assert.equal(sources.length, 1);
});

it("rejects an invalid citation before opening the transaction", async () => {
  let called = false;
  await assert.rejects(persistReadyQuiz(async () => { called = true; throw new Error("unexpected"); }, {
    ownerId: "owner-1", title: "Notes", sourceType: "text", chunks: ["Actual quote"],
    questions: [{ type: "TRUE_FALSE", question: "Is Alpha supported?", content: { correctAnswer: true },
      explanation: "Alpha is explicitly supported.", sources: [{ chunkId: "chunk-1", quote: "Invented quote" }] }],
  }), /Invalid source reference/);
  assert.equal(called, false);
});
