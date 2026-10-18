import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_BATCH_TOKEN_BUDGET,
  packSourceChunks,
} from "../batch.service.js";
import { estimateTokens } from "../tokens.js";
import { words } from "./helpers.js";

describe("packSourceChunks", () => {
  it("returns an empty list for empty input", () => {
    assert.deepEqual(packSourceChunks([], 3000), []);
  });

  it("preserves source order and original chunk indices", () => {
    const chunks = ["alpha source chunk", "beta source chunk", "gamma source chunk"];
    const packs = packSourceChunks(chunks, DEFAULT_BATCH_TOKEN_BUDGET);

    assert.equal(packs.length, 1);
    assert.deepEqual(packs[0]!.chunkIndices, [0, 1, 2]);
    assert.deepEqual(packs[0]!.chunks.map((chunk) => chunk.chunkId), ["chunk-1", "chunk-2", "chunk-3"]);
    assert.equal(
      packs[0]!.text,
      "[chunk-1]\nalpha source chunk\n\n---\n\n[chunk-2]\nbeta source chunk\n\n---\n\n[chunk-3]\ngamma source chunk",
    );
  });

  it("packs multiple small chunks under the input token budget", () => {
    const chunks = [words(50), words(50), words(50)];
    const packs = packSourceChunks(chunks, DEFAULT_BATCH_TOKEN_BUDGET);

    assert.equal(packs.length, 1);
    assert.equal(packs[0]!.estimatedInputTokens, estimateTokens(packs[0]!.text));
    assert.ok(packs[0]!.estimatedInputTokens <= DEFAULT_BATCH_TOKEN_BUDGET);
  });

  it("keeps IDs stable when the same chunks split into different packs", () => {
    const chunks = [words(20), words(20), words(20)];
    const loose = packSourceChunks(chunks, 3000);
    const tight = packSourceChunks(chunks, 30);
    assert.deepEqual(loose.flatMap((pack) => pack.chunks.map((chunk) => chunk.chunkId)),
      tight.flatMap((pack) => pack.chunks.map((chunk) => chunk.chunkId)));
  });

  it("counts join separators against the input budget", () => {
    // Chunk labels and separators count against the budget.
    const chunks = [words(5), words(5)];
    const packs = packSourceChunks(chunks, 14);

    assert.equal(packs.length, 2);
    for (const pack of packs) {
      assert.equal(pack.estimatedInputTokens, estimateTokens(pack.text));
      assert.ok(pack.estimatedInputTokens <= 14);
    }
  });

  it("opens a new pack when adding a chunk would exceed the input budget", () => {
    const big = words(400);
    const packs = packSourceChunks([big, big, big, big], 600);

    assert.ok(packs.length >= 3);
    for (const pack of packs) {
      assert.ok(pack.estimatedInputTokens > 0);
      assert.ok(pack.chunkIndices.length >= 1);
    }

    const allIndices = packs.flatMap((p) => p.chunkIndices);
    assert.deepEqual(allIndices, [0, 1, 2, 3]);
  });

  it("keeps an oversized single chunk as its own pack", () => {
    const oversized = words(1000);
    const packs = packSourceChunks([oversized], 100);

    assert.equal(packs.length, 1);
    assert.deepEqual(packs[0]!.chunkIndices, [0]);
    assert.equal(packs[0]!.estimatedInputTokens, estimateTokens(`[chunk-1]\n${oversized}`));
  });
});
