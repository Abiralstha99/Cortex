import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAndValidateQuestions,
  dedupeQuestions,
} from "../validation.service.js";
import type { GeneratedQuestion } from "../../../types/quiz.types.js";

const good = {
  question: "What is the capital of France?",
  options: ["Paris", "Lyon", "Nice", "Lille"],
  correctIndex: 0,
  explanation: "Paris is the capital and largest city of France.",
};

describe("parseAndValidateQuestions", () => {
  it("parses fenced JSON arrays", () => {
    const raw = "```json\n" + JSON.stringify([good]) + "\n```";
    const out = parseAndValidateQuestions(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.correctIndex, 0);
  });

  it("throws on invalid JSON", () => {
    assert.throws(
      () => parseAndValidateQuestions("not-json"),
      (e: unknown) =>
        e instanceof Error && e.message === "Response was not valid JSON",
    );
  });

  it("throws when options length is not 4", () => {
    const bad = { ...good, options: ["a", "b"] };
    assert.throws(() => parseAndValidateQuestions(JSON.stringify([bad])), Error);
  });
});

describe("dedupeQuestions", () => {
  it("drops near-duplicate question text", () => {
    const a: GeneratedQuestion = {
      question: "What is the capital of France??",
      options: ["Paris", "Lyon", "Nice", "Lille"],
      correctIndex: 0,
      explanation: "Paris is the capital and largest city of France.",
    };
    const b: GeneratedQuestion = {
      question: "What is the capital of France?",
      options: ["Paris", "Lyon", "Marseille", "Lille"],
      correctIndex: 0,
      explanation: "Paris remains the capital of France today.",
    };
    const out = dedupeQuestions([a, b]);
    assert.equal(out.length, 1);
  });
});
