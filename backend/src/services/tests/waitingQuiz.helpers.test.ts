import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { waitingQuizPublicState } from "../waitingQuiz.helpers.js";

describe("waitingQuizPublicState", () => {
  it("exposes processing without quizId", () => {
    assert.deepEqual(
      waitingQuizPublicState({
        quizId: "",
        quizGenStatus: "processing",
        quizGenError: "",
      }),
      { quizId: null, quizGenStatus: "processing", quizGenError: null },
    );
  });

  it("treats legacy rooms with quizId but no quizGenStatus as ready", () => {
    assert.deepEqual(
      waitingQuizPublicState({
        quizId: "quiz-legacy-1",
        quizGenStatus: "",
        quizGenError: "",
      }),
      { quizId: "quiz-legacy-1", quizGenStatus: "ready", quizGenError: null },
    );
  });

  it("exposes failed error message", () => {
    assert.deepEqual(
      waitingQuizPublicState({
        quizId: "",
        quizGenStatus: "failed",
        quizGenError: "No questions generated",
      }),
      {
        quizId: null,
        quizGenStatus: "failed",
        quizGenError: "No questions generated",
      },
    );
  });
});
