import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  CompletionTransactionRunner,
  GameCompletionTransaction,
} from "../gameCompletion.persistence.js";
import { persistGameCompletion } from "../gameCompletion.persistence.js";

const leaderboard = [
  { rank: 1, playerId: "player-a", username: "A", score: 300 },
  { rank: 1, playerId: "player-b", username: "B", score: 300 },
  { rank: 3, playerId: "player-c", username: "C", score: 100 },
];

const answers = [
  {
    playerId: "player-a",
    roundNumber: 1,
    questionId: "question-1",
    answerIndex: 2,
    correct: true,
    pointsEarned: 100,
    placement: 1,
    responseTimeMs: 800,
    submittedAt: "2026-09-29T12:00:00.800Z",
  },
];

function transactionRecorder() {
  const calls: { model: string; args: unknown }[] = [];
  const transaction = {
    gamePlayer: {
      upsert: async (args: unknown) => calls.push({ model: "gamePlayer", args }),
    },
    answer: {
      upsert: async (args: unknown) => calls.push({ model: "answer", args }),
    },
    game: {
      update: async (args: unknown) => calls.push({ model: "game", args }),
    },
  };
  const runTransaction: CompletionTransactionRunner = async (work) =>
    work(transaction as unknown as GameCompletionTransaction);

  return { calls, runTransaction };
}

describe("persistGameCompletion", () => {
  it("writes players, answers, and finished status within one transaction", async () => {
    const { calls, runTransaction } = transactionRecorder();
    const finishedAt = new Date("2026-09-29T12:05:00.000Z");

    await persistGameCompletion(runTransaction, {
      gameId: "game-1",
      leaderboard,
      answers,
      finishedAt,
    });

    assert.deepEqual(calls.map(({ model }) => model), [
      "gamePlayer",
      "gamePlayer",
      "gamePlayer",
      "answer",
      "game",
    ]);
    assert.deepEqual(calls.at(-1), {
      model: "game",
      args: {
        where: { id: "game-1" },
        data: { status: "finished", finishedAt },
      },
    });
  });

  it("does not write finished status when an answer write fails", async () => {
    const { calls } = transactionRecorder();
    const failingTransaction: CompletionTransactionRunner = async <T>(
      work: (tx: GameCompletionTransaction) => Promise<T>,
    ): Promise<T> => {
      const failingTx = {
        gamePlayer: {
          upsert: async (args: unknown) => calls.push({ model: "gamePlayer", args }),
        },
        answer: {
          upsert: async () => {
            throw new Error("answer insert failed");
          },
        },
        game: {
          update: async (args: unknown) => calls.push({ model: "game", args }),
        },
      } as unknown as GameCompletionTransaction;
      return work(failingTx);
    };

    await assert.rejects(
      persistGameCompletion(failingTransaction, {
        gameId: "game-1",
        leaderboard,
        answers,
        finishedAt: new Date("2026-09-29T12:05:00.000Z"),
      }),
      /answer insert failed/,
    );
    assert.equal(calls.some(({ model }) => model === "game"), false);
  });
});
