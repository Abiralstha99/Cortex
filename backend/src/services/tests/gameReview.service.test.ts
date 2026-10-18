import assert from "node:assert/strict";
import { it } from "node:test";
import { formatGameReview, reviewGameQuery } from "../gameReview.service.js";

type ReviewGame = Parameters<typeof formatGameReview>[1];

const question = {
  id: "question-1", question: "Which city is the capital?", type: "MCQ", explanation: "Paris is the capital.",
  content: { options: ["Paris", "Lyon", "Nice", "Lille"], correctIndex: 0 },
  sourceReferences: [{ quote: "Paris is the capital", sourceChunk: { chunkId: "chunk-1" } }],
};

it("requires finished status and a persisted member in the database query", () => {
  assert.deepEqual(reviewGameQuery("game-1", "player-1").where, {
    id: "game-1", status: "finished", gamePlayers: { some: { userId: "player-1" } },
  });
});

it("returns played order including a round nobody answered", () => {
  const result = formatGameReview("game-1", {
    rounds: 2,
    playedRounds: [
      { roundNumber: 1, questionId: "question-2", question: { ...question, id: "question-2", sourceReferences: [] } },
      { roundNumber: 2, questionId: "question-1", question },
    ],
    answers: [{ questionId: "question-1", response: 1, correct: false, points: 0 }],
  } as unknown as ReviewGame);
  assert.ok(result);
  assert.deepEqual(result.rounds.map((round) => round.roundNumber), [1, 2]);
  assert.equal(result.rounds[0]!.playerAnswer, null);
  assert.deepEqual(result.rounds[0]!.sources, []);
  assert.equal(result.rounds[1]!.correctAnswer, "Paris");
  assert.deepEqual(result.rounds[1]!.sources, [{ chunkId: "chunk-1", quote: "Paris is the capital" }]);
});

it("withholds a review when played order is absent or incomplete", () => {
  assert.equal(formatGameReview("game-1", null), null);
  assert.equal(formatGameReview("game-1", { rounds: 2, playedRounds: [], answers: [] } as unknown as ReviewGame), null);
  assert.equal(formatGameReview("game-1", {
    rounds: 2, playedRounds: [{ roundNumber: 1, questionId: "question-1", question }], answers: [],
  } as unknown as ReviewGame), null);
});
