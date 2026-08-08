import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateTokens } from "../tokens.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    assert.equal(estimateTokens(""), 0);
    assert.equal(estimateTokens("   "), 0);
  });

  it("approximates tokens as ceil(words * 1.3)", () => {
    const text = "one two three four five six seven eight nine ten";
    assert.equal(estimateTokens(text), 13);
  });
});
