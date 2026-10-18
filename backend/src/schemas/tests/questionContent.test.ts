import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GeneratedQuestionSchema } from "../quiz.js";
import { gradeAnswer, correctAnswerLabel } from "../../services/questionAnswer.service.js";

const base = { question: "What is the answer to this question?", explanation: "The notes explain the answer clearly." };

describe("question content", () => {
  it("validates all three question variants", () => {
    for (const value of [
      { ...base, type: "MCQ", content: { options: ["A", "B", "C", "D"], correctIndex: 1 } },
      { ...base, type: "TRUE_FALSE", content: { correctAnswer: true } },
      { ...base, type: "FILL_BLANK", content: { acceptedAnswers: ["New York", "NYC"] } },
    ]) assert.equal(GeneratedQuestionSchema.safeParse(value).success, true);
  });
  it("rejects malformed content for its type", () => {
    assert.equal(GeneratedQuestionSchema.safeParse({ ...base, type: "TRUE_FALSE", content: { correctIndex: 0 } }).success, false);
    assert.equal(GeneratedQuestionSchema.safeParse({ ...base, type: "FILL_BLANK", content: { acceptedAnswers: [" "] } }).success, false);
  });
  it("matches accepted blanks after whitespace and case normalization", () => {
    const question = { type: "FILL_BLANK" as const, content: { acceptedAnswers: ["New York", "NYC"] } };
    assert.equal(gradeAnswer(question, "  new   YORK  "), true);
    assert.equal(gradeAnswer(question, "nyc"), true);
    assert.equal(gradeAnswer(question, "New York City"), false);
    assert.equal(correctAnswerLabel(question), "New York / NYC");
    assert.equal(gradeAnswer({ type: "TRUE_FALSE", content: { correctAnswer: false } }, false), true);
    assert.equal(gradeAnswer({ type: "TRUE_FALSE", content: { correctAnswer: false } }, true), false);
    assert.equal(gradeAnswer({ type: "MCQ", content: { options: ["A", "B", "C", "D"], correctIndex: 2 } }, 2), true);
  });
});
