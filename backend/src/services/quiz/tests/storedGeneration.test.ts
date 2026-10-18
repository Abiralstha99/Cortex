import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import redis from "../../../lib/redis.js";

after(() => redis.disconnect());

import {
  executeStoredGenerationWithDeps,
  QuizGenerationIncompleteError,
  type StoredGenerationDeps,
} from "../pipeline.js";
import type { GeneratedQuestion } from "../../../types/quiz.types.js";
import type { QuizGenWorkPayload } from "../persist.service.js";

const testModelConfig = {
  model: "test-model",
  maxOutputTokens: 1000,
  usableOutputBudget: 800,
  apiKey: "test-api-key",
};

const question: GeneratedQuestion = {
  question: "What does the source explain?",
  type: "MCQ",
  content: { options: ["First", "Second", "Third", "Fourth"], correctIndex: 0 },
  explanation: "The source supports the first answer.",
  sources: [{ chunkId: "chunk-1", quote: "source notes" }],
};

function workPayload(gameId = "game-1"): QuizGenWorkPayload {
  return {
    chunks: ["source notes"],
    requestedCount: 2,
    sourceType: "text" as const,
    title: "Source notes",
    ownerId: "owner-1",
    ...(gameId ? { gameId } : {}),
  };
}

function successfulGeneration() {
  return {
    questions: [question, { ...question, question: "Which claim is supported?" }],
    complete: true,
    metrics: {
      resolvedModel: "test-model",
      configuredMaxOutputTokens: 1000,
      usableOutputBudget: 800,
      requestedTotal: 2,
      batchSizes: [2],
      outputTokensByBatch: [200],
      tokensPerQuestionByBatch: [100],
      finishReasons: ["stop"],
      validationOutcomes: ["valid" as const],
      retries: 0,
      failedBatches: 0,
      successfulBatchCount: 1,
      totalLlmCalls: 1,
      durationMs: 1,
      finalGeneratedCount: 2,
    },
  };
}

describe("stored adaptive quiz generation", () => {
  it("marks a job ready only after persistence and then dispatches room attachment", async () => {
    const calls: string[] = [];
    const deps: StoredGenerationDeps = {
      loadWork: async () => workPayload(),
      generateQuiz: async () => successfulGeneration(),
      persistQuiz: async () => {
        calls.push("persist");
        return { id: "quiz-1", questionCount: 2 };
      },
      recordPersistedQuiz: async () => {},
      markReady: async () => {
        calls.push("ready");
      },
      markFailed: async () => {
        calls.push("failed");
      },
      clearWork: async () => {
        calls.push("clear");
      },
      enqueueWaitingRoomJob: async (name, data) => {
        calls.push("attach");
        assert.equal(name, "attach-quiz-to-waiting-game");
        assert.deepEqual(data, {
          type: "attach",
          gameId: "game-1",
          quizId: "quiz-1",
          questionCount: 2,
        });
      },
    };

    await executeStoredGenerationWithDeps("job-1", testModelConfig, deps);

    assert.deepEqual(calls, ["persist", "ready", "attach", "clear"]);
  });

  it("fails incomplete jobs and dispatches room failure without persisting or attaching a quiz", async () => {
    const calls: string[] = [];
    const deps: StoredGenerationDeps = {
      loadWork: async () => workPayload(),
      generateQuiz: async () => {
        throw new QuizGenerationIncompleteError(2, 1);
      },
      persistQuiz: async () => {
        calls.push("persist");
        return { id: "quiz-1", questionCount: 2 };
      },
      recordPersistedQuiz: async () => {},
      markReady: async () => {
        calls.push("ready");
      },
      markFailed: async () => {
        calls.push("failed");
      },
      clearWork: async () => {
        calls.push("clear");
      },
      enqueueWaitingRoomJob: async (name, data) => {
        calls.push("room-failed");
        assert.equal(name, "fail-waiting-quiz-generation");
        assert.equal(data.type, "fail");
      },
    };

    await executeStoredGenerationWithDeps("job-1", testModelConfig, deps);

    assert.deepEqual(calls, ["failed", "room-failed"]);
  });

  it("does not regenerate a quiz after persistence when the ready transition is retried", async () => {
    const work = workPayload("");
    let persistCount = 0;
    let readyAttempts = 0;
    const deps: StoredGenerationDeps = {
      loadWork: async () => work,
      generateQuiz: async () => successfulGeneration(),
      persistQuiz: async () => {
        persistCount++;
        return { id: "quiz-1", questionCount: 2 };
      },
      recordPersistedQuiz: async (_jobId, quiz) => {
        work.persistedQuizId = quiz.id;
        work.persistedQuestionCount = quiz.questionCount;
      },
      markReady: async () => {
        readyAttempts++;
        if (readyAttempts === 1) throw new Error("Redis unavailable");
      },
      markFailed: async () => {
        throw new Error("a persisted quiz must not be marked failed");
      },
      clearWork: async () => {},
      enqueueWaitingRoomJob: async () => {},
    };

    await assert.rejects(
      executeStoredGenerationWithDeps("job-1", testModelConfig, deps),
      /Redis unavailable/,
    );
    await executeStoredGenerationWithDeps("job-1", testModelConfig, deps);

    assert.equal(persistCount, 1);
    assert.equal(readyAttempts, 2);
  });
});
