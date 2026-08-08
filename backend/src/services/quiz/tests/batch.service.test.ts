import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_BATCH_TOKEN_BUDGET,
  planBatches,
} from "../batch.service.js";
import { estimateTokens } from "../tokens.js";
import { words } from "./helpers.js";

describe("planBatches", () => {
  it("returns plannedLlmCalls equal to batches.length", () => {
    const chunks = [words(100), words(100), words(100)];
    const { batches, plannedLlmCalls } = planBatches(chunks, 6);
    assert.equal(plannedLlmCalls, batches.length);
    assert.ok(batches.length >= 1);
    const totalQ = batches.reduce((s, b) => s + b.questionCount, 0);
    assert.equal(totalQ, 6);
  });

  it("packs multiple small chunks into one batch under token budget", () => {
    const chunks = [words(50), words(50), words(50)];
    const { batches, plannedLlmCalls } = planBatches(chunks, 3, {
      tokenBudget: DEFAULT_BATCH_TOKEN_BUDGET,
    });
    assert.equal(plannedLlmCalls, 1);
    assert.equal(batches.length, 1);
    assert.equal(batches[0]!.questionCount, 3);
  });

  it("opens a new batch when adding a chunk would exceed token budget", () => {
    const big = words(400);
    const chunks = [big, big, big, big];
    const { batches, plannedLlmCalls } = planBatches(chunks, 8, {
      tokenBudget: 600,
      maxQuestionsPerBatch: 8,
    });
    assert.ok(plannedLlmCalls >= 3);
    for (const b of batches) {
      assert.ok(estimateTokens(b.text) <= 700);
    }
  });

  it("never assigns more questions per batch than maxQuestionsPerBatch", () => {
    const { batches } = planBatches([words(200)], 50, {
      maxQuestionsPerBatch: 8,
    });
    for (const b of batches) {
      assert.ok(b.questionCount <= 8);
    }
  });
});
