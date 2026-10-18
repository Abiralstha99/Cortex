import type { Prisma } from "../../app/generated/prisma/client.js";
import {
  buildAnswerRecords,
  buildGamePlayerRecords,
} from "./gameCompletion.helpers.js";
import type { LeaderboardEntry, SubmissionRecord } from "../types/room.types.js";

export type GameCompletionTransaction = Prisma.TransactionClient;
export type CompletionTransactionRunner = <T>(
  operation: (transaction: GameCompletionTransaction) => Promise<T>,
) => Promise<T>;

export async function persistGameCompletion(
  runTransaction: CompletionTransactionRunner,
  input: {
    gameId: string;
    leaderboard: LeaderboardEntry[];
    answers: SubmissionRecord[];
    questionIds: string[];
    finishedAt: Date;
  },
): Promise<void> {
  const playerRecords = buildGamePlayerRecords(input.gameId, input.leaderboard);
  const answerRecords = buildAnswerRecords(input.gameId, input.answers);

  await runTransaction(async (transaction) => {
    for (const record of playerRecords) {
      await transaction.gamePlayer.upsert({
        where: {
          gameId_userId: { gameId: record.gameId, userId: record.userId },
        },
        create: record,
        update: { score: record.score, rank: record.rank },
      });
    }

    for (const record of answerRecords) {
      await transaction.answer.upsert({
        where: {
          gameId_userId_questionId: {
            gameId: record.gameId,
            userId: record.userId,
            questionId: record.questionId,
          },
        },
        create: record,
        update: {
          response: record.response,
          correct: record.correct,
          points: record.points,
          responseTimeMs: record.responseTimeMs,
          createdAt: record.createdAt,
        },
      });
    }

    for (const [index, questionId] of input.questionIds.entries()) {
      await transaction.gameRound.upsert({
        where: { gameId_roundNumber: { gameId: input.gameId, roundNumber: index + 1 } },
        create: { gameId: input.gameId, roundNumber: index + 1, questionId },
        update: { questionId },
      });
    }

    await transaction.game.update({
      where: { id: input.gameId },
      data: { status: "finished", finishedAt: input.finishedAt },
    });
  });
}
