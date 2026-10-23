import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAnswerRecords,
  buildGameFinishedPayload,
  buildGamePlayerRecords,
  rankPlayers,
  previousLeaderboard,
} from "../gameCompletion.helpers.js";

describe("rankPlayers", () => {
  it("reconstructs tie-aware standings before the awarded points", () => {
    const final = rankPlayers([
      { id: "a", username: "A", ready: true, score: 200 },
      { id: "b", username: "B", ready: true, score: 200 },
      { id: "c", username: "C", ready: true, score: 100 },
    ]);
    const previous = previousLeaderboard(final, [
      { playerId: "a", pointsEarned: 100 },
      { playerId: "b", pointsEarned: 0 },
      { playerId: "c", pointsEarned: 0 },
    ]);
    assert.deepEqual(previous.map(({ playerId, score, rank }) => ({ playerId, score, rank })), [
      { playerId: "b", score: 200, rank: 1 },
      { playerId: "a", score: 100, rank: 2 },
      { playerId: "c", score: 100, rank: 2 },
    ]);
  });
  it("assigns shared competition ranks and skips ranks after ties", () => {
    const leaderboard = rankPlayers([
      { id: "player-a", username: "A", ready: true, score: 300 },
      { id: "player-b", username: "B", ready: true, score: 300 },
      { id: "player-c", username: "C", ready: true, score: 200 },
      { id: "player-d", username: "D", ready: true, score: 100 },
    ]);

    assert.deepEqual(
      leaderboard.map(({ playerId, rank }) => ({ playerId, rank })),
      [
        { playerId: "player-a", rank: 1 },
        { playerId: "player-b", rank: 1 },
        { playerId: "player-c", rank: 3 },
        { playerId: "player-d", rank: 4 },
      ],
    );
  });

  it("keeps the Redis player order for equal scores", () => {
    const leaderboard = rankPlayers([
      { id: "player-b", username: "B", ready: true, score: 100 },
      { id: "player-a", username: "A", ready: true, score: 100 },
    ]);

    assert.deepEqual(
      leaderboard.map(({ playerId }) => playerId),
      ["player-b", "player-a"],
    );
  });
});

describe("game completion record builders", () => {
  it("preserves false and text answers as JSON responses", () => {
    const base = { playerId: "player-a", roundNumber: 1, correct: true,
      pointsEarned: 100, placement: 1, responseTimeMs: 500,
      submittedAt: "2026-09-29T12:00:00.500Z" };
    const records = buildAnswerRecords("game-1", [
      { ...base, questionId: "true-false", answer: false },
      { ...base, questionId: "blank", answer: "  New York  " },
    ]);
    assert.deepEqual(records.map((record) => record.response), [false, "  New York  "]);
  });

  it("includes every rank-one player in the finished payload", () => {
    const finalLeaderboard = rankPlayers([
      { id: "player-a", username: "A", ready: true, score: 300 },
      { id: "player-b", username: "B", ready: true, score: 300 },
      { id: "player-c", username: "C", ready: true, score: 100 },
    ]);

    assert.deepEqual(buildGameFinishedPayload(finalLeaderboard), {
      finalLeaderboard,
      winners: [finalLeaderboard[0], finalLeaderboard[1]],
    });
  });

  it("maps only submitted answers to JSON response records", () => {
    const records = buildAnswerRecords("game-1", [
      {
        playerId: "player-a",
        roundNumber: 1,
        questionId: "question-1",
        answer: 2,
        correct: true,
        pointsEarned: 100,
        placement: 1,
        responseTimeMs: 720,
        submittedAt: "2026-09-29T12:00:00.720Z",
      },
      {
        playerId: "player-b",
        roundNumber: 1,
        questionId: "",
        answer: null,
        correct: false,
        pointsEarned: 0,
        placement: null,
        responseTimeMs: 0,
        submittedAt: "2026-09-29T12:00:30.000Z",
      },
    ]);

    assert.deepEqual(records, [
      {
        gameId: "game-1",
        userId: "player-a",
        questionId: "question-1",
        response: 2,
        correct: true,
        points: 100,
        responseTimeMs: 720,
        createdAt: new Date("2026-09-29T12:00:00.720Z"),
      },
    ]);
  });

  it("maps every ranked player including tied winners", () => {
    const leaderboard = rankPlayers([
      { id: "player-a", username: "A", ready: true, score: 200 },
      { id: "player-b", username: "B", ready: true, score: 200 },
      { id: "player-c", username: "C", ready: true, score: 100 },
    ]);

    assert.deepEqual(buildGamePlayerRecords("game-1", leaderboard), [
      { gameId: "game-1", userId: "player-a", score: 200, rank: 1 },
      { gameId: "game-1", userId: "player-b", score: 200, rank: 1 },
      { gameId: "game-1", userId: "player-c", score: 100, rank: 3 },
    ]);
  });
});
