import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chunkText } from "../chunk.service.js";
import { estimateTokens } from "../tokens.js";
import { words } from "./helpers.js";

describe("chunkText", () => {
  it("throws when text is too short after split heuristics", async () => {
    await assert.rejects(
      () => chunkText("tiny"),
      (err: unknown) =>
        err instanceof Error && err.message === "Text too short to chunk",
    );
  });

  it("returns one or more chunks within token budget", async () => {
    const text = words(400);
    const chunks = await chunkText(text);
    assert.ok(chunks.length >= 1);
    for (const c of chunks) {
      const t = estimateTokens(c);
      assert.ok(t <= 900, `chunk too large: ${t}`);
    }
  });

  it("merges very short adjacent material", async () => {
    const paragraph = words(80);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const chunks = await chunkText(text);
    assert.ok(chunks.length >= 1);
    assert.ok(chunks.some((c) => estimateTokens(c) >= 200));
  });
});
