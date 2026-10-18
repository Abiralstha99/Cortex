import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAdaptivePlanner } from "../adaptive-planner.service.js";
import type { BatchOutcome, SourcePack } from "../../../types/quiz.types.js";

const sourcePacks: SourcePack[] = [
  {
    text: "first source pack",
    chunkIndices: [0],
    chunks: [{ chunkId: "chunk-1", text: "first source pack" }],
    estimatedInputTokens: 10,
  },
  {
    text: "second source pack",
    chunkIndices: [1],
    chunks: [{ chunkId: "chunk-2", text: "second source pack" }],
    estimatedInputTokens: 12,
  },
];

function outcome(overrides: Partial<BatchOutcome> = {}): BatchOutcome {
  return {
    requestedQuestionCount: 4,
    generatedQuestionCount: 0,
    uniqueQuestionCount: 0,
    validationOutcome: "provider-error",
    healthy: false,
    retried: false,
    ...overrides,
  };
}

describe("adaptive quiz planner", () => {
  it("starts conservatively, advances through source packs, and records a healthy batch", () => {
    const planner = createAdaptivePlanner({
      sourcePacks,
      requestedTotal: 10,
      usableOutputBudget: 1000,
    });

    assert.deepEqual(planner.nextBatch(), {
      questionCount: 4,
      sourcePack: sourcePacks[0],
      sourcePackIndex: 0,
    });

    planner.recordOutcome(
      outcome({
        requestedQuestionCount: 4,
        generatedQuestionCount: 4,
        uniqueQuestionCount: 4,
        outputTokens: 600,
        finishReason: "stop",
        validationOutcome: "valid",
        healthy: true,
      }),
    );

    assert.deepEqual(planner.getState(), {
      requestedTotal: 10,
      generatedTotal: 4,
      remainingQuestions: 6,
      currentBatchSize: 5,
      observedTokensPerQuestion: 150,
      usableOutputBudget: 1000,
      previousBatchOutcome: outcome({
        requestedQuestionCount: 4,
        generatedQuestionCount: 4,
        uniqueQuestionCount: 4,
        outputTokens: 600,
        finishReason: "stop",
        validationOutcome: "valid",
        healthy: true,
      }),
      successfulBatchCount: 1,
      failedBatchCount: 0,
      retryCount: 0,
      totalLlmCalls: 1,
      noProgressCount: 0,
    });
    assert.deepEqual(planner.nextBatch(), {
      questionCount: 5,
      sourcePack: sourcePacks[1],
      sourcePackIndex: 1,
    });
  });

  it("completes normal successful batches without planning beyond the remaining questions", () => {
    const planner = createAdaptivePlanner({
      sourcePacks,
      requestedTotal: 6,
      usableOutputBudget: 1000,
      initialBatchSize: 4,
      maxQuestionsPerBatch: 8,
    });

    planner.nextBatch();
    planner.recordOutcome(
      outcome({
        generatedQuestionCount: 4,
        uniqueQuestionCount: 4,
        outputTokens: 400,
        finishReason: "stop",
        validationOutcome: "valid",
        healthy: true,
      }),
    );
    assert.equal(planner.nextBatch().questionCount, 2);

    planner.recordOutcome(
      outcome({
        requestedQuestionCount: 2,
        generatedQuestionCount: 2,
        uniqueQuestionCount: 2,
        outputTokens: 200,
        finishReason: "stop",
        validationOutcome: "valid",
        healthy: true,
      }),
    );

    assert.equal(planner.hasRemainingQuestions(), false);
    assert.equal(planner.getState().generatedTotal, 6);
    assert.equal(planner.getState().successfulBatchCount, 2);
  });

  it("reduces a length-limited batch and excludes its tokens from the estimate", () => {
    const planner = createAdaptivePlanner({
      sourcePacks,
      requestedTotal: 10,
      usableOutputBudget: 1000,
      initialBatchSize: 6,
      maxQuestionsPerBatch: 8,
    });

    planner.nextBatch();
    planner.recordOutcome(
      outcome({
        requestedQuestionCount: 6,
        outputTokens: 1000,
        finishReason: "length",
        validationOutcome: "capacity-failure",
      }),
    );

    const state = planner.getState();
    assert.equal(state.currentBatchSize, 3);
    assert.equal(state.observedTokensPerQuestion, null);
    assert.equal(state.failedBatchCount, 1);
    assert.equal(state.retryCount, 0);
    assert.equal(planner.nextBatch().questionCount, 3);
  });

  it("records malformed normal responses as retries without treating them as capacity failures", () => {
    const planner = createAdaptivePlanner({
      sourcePacks,
      requestedTotal: 8,
      usableOutputBudget: 1000,
    });

    planner.nextBatch();
    planner.recordOutcome(
      outcome({
        outputTokens: 300,
        finishReason: "stop",
        validationOutcome: "invalid-json",
        retried: true,
      }),
    );

    const state = planner.getState();
    assert.equal(state.currentBatchSize, 4);
    assert.equal(state.observedTokensPerQuestion, null);
    assert.equal(state.failedBatchCount, 1);
    assert.equal(state.retryCount, 1);
    assert.equal(state.noProgressCount, 1);
  });

  it("fails after the configured consecutive no-progress limit", () => {
    const planner = createAdaptivePlanner({
      sourcePacks,
      requestedTotal: 8,
      usableOutputBudget: 1000,
      maxNoProgressBatches: 2,
    });

    planner.nextBatch();
    planner.recordOutcome(outcome());
    planner.nextBatch();

    assert.throws(
      () => planner.recordOutcome(outcome()),
      /no progress/i,
    );
  });
});
