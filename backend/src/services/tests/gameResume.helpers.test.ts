import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { buildGameSnapshot, isGameMember } from "../gameResume.service.js";
import redis from "../../lib/redis.js";

after(() => redis.disconnect());

const game = {
  status: "playing",
  numberOfRounds: "3",
  currentRound: "1",
  phaseVersion: "2",
  players: JSON.stringify([{ id: "player-1", username: "Ada", ready: true, score: 0 }]),
  publicPhase: "question",
  publicPayload: JSON.stringify({ roundNumber: 1, questionId: "q1", question: "Question?", type: "MCQ", options: ["A", "B", "C", "D"], startedAt: new Date().toISOString() }),
};

describe("game recovery snapshot", () => {
  it("rejects a nonmember without exposing game state", () => {
    assert.deepEqual(buildGameSnapshot(game, "stranger", null), { ok: false, reason: "not_member" });
  });

  it("treats the gap before the first countdown phase as temporary", () => {
    assert.deepEqual(buildGameSnapshot({ ...game, publicPhase: "" }, "player-1", null),
      { ok: false, reason: "temporary" });
  });

  it("enforces membership for answer submission", () => {
    assert.equal(isGameMember(game, "player-1"), true);
    assert.equal(isGameMember(game, "stranger"), false);
  });

  it("does not disclose the correct answer to an unanswered player", () => {
    const result = buildGameSnapshot(game, "player-1", null);
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(result).includes("correctAnswer"), false);
    assert.equal(JSON.stringify(result).includes("correctIndex"), false);
  });

  it("restores a submitted answer and its feedback", () => {
    const submission = JSON.stringify({ answer: 2, questionId: "q1", roundNumber: 1, correctAnswer: 2, correct: true, pointsEarned: 100, placement: 1 });
    const result = buildGameSnapshot(game, "player-1", submission);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.snapshot.myAnswer, 2);
      assert.equal(result.snapshot.answerResult?.pointsEarned, 100);
      assert.equal(result.snapshot.answerResult?.correctAnswer, 2);
    }
  });

  it("waits for a submission record to finish scoring", () => {
    assert.deepEqual(buildGameSnapshot(game, "player-1", JSON.stringify({ answer: 2 })),
      { ok: false, reason: "temporary" });
  });

  it("restores countdown, round results, and finished phases", () => {
    for (const phase of ["countdown", "round_results", "game_finished"]) {
      const result = buildGameSnapshot({ ...game, status: phase === "game_finished" ? "finished" : "playing", publicPhase: phase, publicPayload: JSON.stringify({ countdownEndsAt: Date.now() + 3000 }) }, "player-1", null);
      assert.equal(result.ok, true);
      if (result.ok) assert.equal(result.snapshot.phase, phase);
    }
  });
});
