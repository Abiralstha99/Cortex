import assert from "node:assert/strict";
import { test } from "node:test";
import { gradePracticeAnswer, validatePracticeAnswer, resumePosition, publicPracticeQuestion } from "../practice.logic.js";

test("fill answers ignore all whitespace and case without changing entered text", () => {
  const question = { type: "FILL_BLANK" as const, content: { acceptedAnswers: ["Postgre SQL"] } };
  assert.deepEqual(validatePracticeAnswer(question, { answer: " post GRE sql " }), { answer: " post GRE sql " });
  assert.equal(gradePracticeAnswer(question, { answer: " post GRE sql " }), true);
  assert.equal(validatePracticeAnswer(question, { answer: " \t " }), null);
});

test("answer validation follows stored question type", () => {
  const mcq = { type: "MCQ" as const, content: { options: ["a", "b", "c", "d"], correctIndex: 2 } };
  assert.deepEqual(validatePracticeAnswer(mcq, { selectedIndex: 2 }), { selectedIndex: 2 });
  assert.equal(validatePracticeAnswer(mcq, { selectedIndex: 4 }), null);
  assert.equal(validatePracticeAnswer(mcq, { answer: true }), null);
  assert.equal(gradePracticeAnswer(mcq, { selectedIndex: 2 }), true);
  const tf = { type: "TRUE_FALSE" as const, content: { correctAnswer: false } };
  assert.equal(gradePracticeAnswer(tf, { answer: false }), true);
});

test("resume finds first unanswered in shuffled order, or review", () => {
  assert.equal(resumePosition(["c", "a", "b"], ["a", "c"]), 2);
  assert.equal(resumePosition(["c", "a", "b"], ["a", "b", "c"]), -1);
});

test("public practice question omits keys and explanation", () => {
  const question = { id: "q", question: "What is two plus two?", type: "MCQ", content: { options: ["1", "2", "3", "4"], correctIndex: 3 }, explanation: "Add the numbers" };
  assert.deepEqual(publicPracticeQuestion(question), { id: "q", question: "What is two plus two?", type: "MCQ", options: ["1", "2", "3", "4"] });
});
