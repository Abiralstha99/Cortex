import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import redis from "../../../lib/redis.js";

after(() => redis.disconnect());

import {
  generateAdaptiveQuiz,
  preparePipeline,
  QuizGenerationIncompleteError,
} from "../pipeline.js";
import type { GeneratedQuestion } from "../../../types/quiz.types.js";

const testModelConfig = {
  model: "test-model",
  maxOutputTokens: 1250,
  usableOutputBudget: 1000,
  apiKey: "test-api-key",
};

function modelConfig(model: string, maxOutputTokens: number) {
  return {
    model,
    maxOutputTokens,
    usableOutputBudget: maxOutputTokens * 0.8,
    apiKey: "test-api-key",
  };
}

function question(topic: string): GeneratedQuestion {
  return {
    question: topic[0]!.repeat(12),
    type: "MCQ",
    content: { options: ["First option", "Second option", "Third option", "Fourth option"], correctIndex: 0 },
    explanation: `The source material explains the ${topic} concept in detail.`,
    sources: [{ chunkId: "chunk-1", quote: "notes" }],
  };
}

function successfulResponse(topics: string[], outputTokens = 400): {
  text: string;
  finishReason: string;
  outputTokens: number;
} {
  return {
    text: JSON.stringify(topics.map(question)),
    finishReason: "stop",
    outputTokens,
  };
}

function responsesInOrder(
  responses: Array<string | ReturnType<typeof successfulResponse>>,
) {
  return {
    complete: async () => {
      const response = responses.shift();
      if (response === undefined) {
        throw new Error("unexpected extra Gemini call");
      }
      return response;
    },
  };
}

describe("adaptive quiz generation pipeline", () => {
  it("prepares source chunks without constructing a static batch plan", async () => {
    const prepared = await preparePipeline({
      buffer: Buffer.from("Adaptive source material. ".repeat(400)),
      mimeType: "text/plain",
      originalName: "notes.txt",
      requestedCount: 4,
    });

    assert.ok(prepared.chunks.length > 0);
    assert.equal("batches" in prepared, false);
    assert.equal("plannedLlmCalls" in prepared, false);
  });

  it("returns exactly the requested number of validated questions", async () => {
    const result = await generateAdaptiveQuiz(
      {
        chunks: ["notes about the first five concepts"],
        requestedCount: 5,
        modelConfig: testModelConfig,
      },
      responsesInOrder([
        successfulResponse(["alpha", "beta", "gamma", "delta"]),
        successfulResponse(["epsilon"], 100),
      ]),
    );

    assert.equal(result.complete, true);
    assert.equal(result.questions.length, 5);
    assert.deepEqual(
      result.questions.map((item) => item.question),
      ["alpha", "beta", "gamma", "delta", "epsilon"].map(
        (topic) => question(topic).question,
      ),
    );
  });

  it("passes the run's resolved configuration to the Gemini-call boundary", async () => {
    let receivedConfig: unknown;
    const result = await generateAdaptiveQuiz(
      {
        chunks: ["notes for a single question"],
        requestedCount: 1,
        modelConfig: testModelConfig,
      },
      {
        complete: async (_prompt, config) => {
          receivedConfig = config;
          return successfulResponse(["alpha"], 100);
        },
      },
    );

    assert.equal(result.complete, true);
    assert.strictEqual(receivedConfig, testModelConfig);
  });

  it("tracks unique questions across batches and generates replacements for duplicates", async () => {
    const result = await generateAdaptiveQuiz(
      {
        chunks: ["notes with repeated terms"],
        requestedCount: 6,
        modelConfig: testModelConfig,
      },
      responsesInOrder([
        successfulResponse(["alpha", "beta", "gamma", "delta"]),
        successfulResponse(["alpha", "epsilon"], 200),
        successfulResponse(["zeta"], 100),
      ]),
    );

    assert.equal(result.questions.length, 6);
    assert.deepEqual(
      result.questions.map((item) => item.question),
      ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"].map(
        (topic) => question(topic).question,
      ),
    );
    assert.equal(result.metrics.finalGeneratedCount, 6);
    assert.equal(result.metrics.successfulBatchCount, 3);
  });

  it("records per-call usage and final generation metrics", async () => {
    const result = await generateAdaptiveQuiz(
      {
        chunks: ["notes for four questions"],
        requestedCount: 4,
        modelConfig: modelConfig("metrics-model", 1500),
        runId: "metrics-run",
      },
      responsesInOrder([
        successfulResponse(["alpha", "beta", "gamma", "delta"], 480),
      ]),
    );

    assert.deepEqual(result.metrics, {
      resolvedModel: "metrics-model",
      configuredMaxOutputTokens: 1500,
      usableOutputBudget: 1200,
      requestedTotal: 4,
      batchSizes: [4],
      outputTokensByBatch: [480],
      tokensPerQuestionByBatch: [120],
      finishReasons: ["stop"],
      validationOutcomes: ["valid"],
      retries: 0,
      failedBatches: 0,
      successfulBatchCount: 1,
      totalLlmCalls: 1,
      durationMs: result.metrics.durationMs,
      finalGeneratedCount: 4,
    });
    assert.ok(result.metrics.durationMs >= 0);
  });

  it("throws an incomplete-generation error after terminal no-progress failures", async () => {
    await assert.rejects(
      generateAdaptiveQuiz(
        {
          chunks: ["notes that receive malformed output"],
          requestedCount: 4,
          modelConfig: testModelConfig,
        },
        responsesInOrder(["not json", "still not json", "also not json"]),
      ),
      (error: unknown) => {
        assert.ok(error instanceof QuizGenerationIncompleteError);
        assert.equal(error.requestedCount, 4);
        assert.equal(error.generatedCount, 0);
        return true;
      },
    );
  });

  it("retries a batch when a citation is not in the source pack", async () => {
    let attempts = 0;
    const result = await generateAdaptiveQuiz({
      chunks: ["notes about the answer"], requestedCount: 1, modelConfig: testModelConfig,
    }, { complete: async () => {
      attempts++;
      return successfulResponse(["alpha"]).text.replace('"quote":"notes"',
        `"quote":"${attempts === 1 ? "invented" : "notes"}"`);
    } });
    assert.equal(attempts, 2);
    assert.equal(result.metrics.retries, 1);
    assert.deepEqual(result.metrics.validationOutcomes, ["schema-invalid", "valid"]);
    assert.equal(result.questions[0]!.sources[0]!.quote, "notes");
  });
});
