import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAndValidateQuestions,
  dedupeQuestions,
} from "../validation.service.js";
import type { GeneratedQuestion } from "../../../types/quiz.types.js";

const good = {
  question: "What is the capital of France?",
  type: "MCQ",
  content: { options: ["Paris", "Lyon", "Nice", "Lille"], correctIndex: 0 },
  explanation: "Paris is the capital and largest city of France.",
  sources: [{ chunkId: "chunk-1", quote: "Paris" }],
};

describe("parseAndValidateQuestions", () => {
  const sourceChunks = [
    { chunkId: "chunk-1", text: "Paris is the capital of France." },
    { chunkId: "chunk-2", text: "Lyon is known for its cuisine." },
  ];

  it("accepts multiple exact citations from the supplied pack", () => {
    const cited = { ...good, sources: [
      { chunkId: "chunk-1", quote: "Paris is the capital" },
      { chunkId: "chunk-2", quote: "Lyon is known" },
    ] };
    assert.equal(parseAndValidateQuestions(JSON.stringify([cited]), sourceChunks)[0]!.sources.length, 2);
  });

  it("rejects unknown IDs, altered quotes, missing citations, and long explanations", () => {
    const invalid = [
      { ...good, sources: [{ chunkId: "chunk-3", quote: "Paris" }] },
      { ...good, sources: [{ chunkId: "chunk-1", quote: "paris" }] },
      { ...good, sources: [] },
      { ...good, explanation: "x".repeat(321) },
    ];
    for (const question of invalid) {
      assert.throws(() => parseAndValidateQuestions(JSON.stringify([question]), sourceChunks));
    }
  });

  it("parses fenced JSON arrays", () => {
    const raw = "```json\n" + JSON.stringify([good]) + "\n```";
    const out = parseAndValidateQuestions(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.type === "MCQ" && out[0]!.content.correctIndex, 0);
  });

  it("throws on invalid JSON", () => {
    assert.throws(
      () => parseAndValidateQuestions("not-json"),
      (e: unknown) =>
        e instanceof Error && e.message === "Response was not valid JSON",
    );
  });

  it("throws when options length is not 4", () => {
    const bad = { ...good, content: { ...good.content, options: ["a", "b"] } };
    assert.throws(() => parseAndValidateQuestions(JSON.stringify([bad])), Error);
  });
});

describe("dedupeQuestions", () => {
  it("drops near-duplicate question text", () => {
    const a: GeneratedQuestion = {
      question: "What is the capital of France??",
      type: "MCQ",
      content: { options: ["Paris", "Lyon", "Nice", "Lille"], correctIndex: 0 },
      explanation: "Paris is the capital and largest city of France.",
      sources: [{ chunkId: "chunk-1", quote: "Paris" }],
    };
    const b: GeneratedQuestion = {
      question: "What is the capital of France?",
      type: "MCQ",
      content: { options: ["Paris", "Lyon", "Marseille", "Lille"], correctIndex: 0 },
      explanation: "Paris remains the capital of France today.",
      sources: [{ chunkId: "chunk-1", quote: "Paris" }],
    };
    const out = dedupeQuestions([a, b]);
    assert.equal(out.length, 1);
  });
});
