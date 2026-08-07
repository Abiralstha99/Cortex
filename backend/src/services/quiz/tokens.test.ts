// backend/src/services/quiz/tokens.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateTokens } from "./tokens.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    assert.equal(estimateTokens(""), 0);
    assert.equal(estimateTokens("   "), 0);
  });

  it("approximates tokens as ceil(words * 1.3)", () => {
    // 10 words → ceil(13) = 13
    const text = "one two three four five six seven eight nine ten";
    assert.equal(estimateTokens(text), 13);
  });
});
