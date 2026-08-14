import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertCanStartWithQuiz,
  assertQuizPlayableForHost,
  capRoundsToQuiz,
  normalizeWaitingQuizId,
  publicNewQuestionPayload,
} from "../gamePlay.helpers.js";

describe("assertQuizPlayableForHost", () => {
  const base = {
    id: "q1",
    ownerId: "host-1",
    status: "ready" as const,
    questionCount: 5,
  };

  it("throws Quiz not found when quiz is null", () => {
    assert.throws(
      () => assertQuizPlayableForHost(null, "host-1"),
      (e: unknown) => e instanceof Error && e.message === "Quiz not found",
    );
  });

  it("throws Quiz not found when host is not owner (no ownership leak)", () => {
    assert.throws(
      () =>
        assertQuizPlayableForHost(
          { ...base, ownerId: "other-user" },
          "host-1",
        ),
      (e: unknown) => e instanceof Error && e.message === "Quiz not found",
    );
  });

  it("throws Quiz is not ready for non-ready status", () => {
    assert.throws(
      () =>
        assertQuizPlayableForHost(
          { ...base, status: "processing" },
          "host-1",
        ),
      (e: unknown) => e instanceof Error && e.message === "Quiz is not ready",
    );
  });

  it("throws Quiz has no questions when questionCount < 1", () => {
    assert.throws(
      () =>
        assertQuizPlayableForHost(
          { ...base, questionCount: 0 },
          "host-1",
        ),
      (e: unknown) => e instanceof Error && e.message === "Quiz has no questions",
    );
  });

  it("passes for ready owned quiz with questions", () => {
    assert.doesNotThrow(() => assertQuizPlayableForHost(base, "host-1"));
  });
});

describe("capRoundsToQuiz", () => {
  it("caps requested rounds to quiz size", () => {
    assert.equal(capRoundsToQuiz(10, 3), 3);
    assert.equal(capRoundsToQuiz(3, 10), 3);
  });
});

describe("publicNewQuestionPayload", () => {
  it("omits correctIndex and explanation", () => {
    const payload = publicNewQuestionPayload({
      questionId: "11111111-1111-1111-1111-111111111111",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      explanation: "Mars appears red due to iron oxide.",
      startedAt: "2026-08-09T12:00:00.000Z",
      roundNumber: 2,
    });

    assert.deepEqual(payload, {
      roundNumber: 2,
      questionId: "11111111-1111-1111-1111-111111111111",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      startedAt: "2026-08-09T12:00:00.000Z",
    });
    assert.equal("correctIndex" in payload, false);
    assert.equal("explanation" in payload, false);
  });
});

describe("normalizeWaitingQuizId", () => {
  it("maps missing and empty to null", () => {
    assert.equal(normalizeWaitingQuizId(undefined), null);
    assert.equal(normalizeWaitingQuizId(""), null);
    assert.equal(normalizeWaitingQuizId("  "), null);
  });
  it("returns trimmed uuid", () => {
    assert.equal(
      normalizeWaitingQuizId(" 11111111-1111-1111-1111-111111111111 "),
      "11111111-1111-1111-1111-111111111111",
    );
  });
});

describe("assertCanStartWithQuiz", () => {
  it("throws when processing", () => {
    assert.throws(
      () => assertCanStartWithQuiz(null, "processing"),
      (e: unknown) =>
        e instanceof Error && e.message === "Quiz is still generating",
    );
  });
  it("throws when failed", () => {
    assert.throws(
      () => assertCanStartWithQuiz(null, "failed"),
      (e: unknown) =>
        e instanceof Error && e.message === "Quiz generation failed",
    );
  });
  it("throws when ready but missing quizId", () => {
    assert.throws(
      () => assertCanStartWithQuiz(null, "ready"),
      (e: unknown) => e instanceof Error && e.message === "Quiz not ready",
    );
  });
  it("passes when ready with quizId", () => {
    assert.doesNotThrow(() =>
      assertCanStartWithQuiz("11111111-1111-1111-1111-111111111111", "ready"),
    );
  });
});
