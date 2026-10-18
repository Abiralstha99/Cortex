import { prisma } from "../lib/prisma.js";
import { QuestionContentSchema } from "../schemas/quiz.js";
import { correctAnswerLabel } from "./questionAnswer.service.js";

export async function getGameReview(gameId: string, userId: string) {
  const game = await loadReviewGame(gameId, userId);
  return formatGameReview(gameId, game);
}

async function loadReviewGame(gameId: string, userId: string) {
  return prisma.game.findFirst(reviewGameQuery(gameId, userId));
}

export function reviewGameQuery(gameId: string, userId: string) {
  return {
    where: {
      id: gameId,
      status: "finished",
      gamePlayers: { some: { userId } },
    },
    select: {
      rounds: true,
      playedRounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          question: {
            include: {
              sourceReferences: {
                include: { sourceChunk: { select: { chunkId: true } } },
              },
            },
          },
        },
      },
      answers: { where: { userId }, select: {
        questionId: true, response: true, correct: true, points: true,
      } },
    },
  } as const;
}

export function formatGameReview(gameId: string, game: Awaited<ReturnType<typeof loadReviewGame>>) {
  // Older games lack played order. Answers cannot reconstruct unanswered rounds.
  if (!game || game.playedRounds.length === 0 || game.playedRounds.length !== game.rounds) {
    return null;
  }

  const answers = new Map(game.answers.map((answer) => [answer.questionId, answer]));
  return {
    gameId,
    rounds: game.playedRounds.map((round) => {
      const question = round.question;
      const content = QuestionContentSchema.parse({ type: question.type, content: question.content });
      const answer = answers.get(question.id);
      return {
        roundNumber: round.roundNumber,
        question: question.question,
        type: question.type,
        options: content.type === "MCQ" ? content.content.options : undefined,
        playerAnswer: answer?.response ?? null,
        correct: answer?.correct ?? null,
        pointsEarned: answer?.points ?? 0,
        correctAnswer: correctAnswerLabel(content),
        explanation: question.explanation,
        sources: question.sourceReferences.map((reference) => ({
          chunkId: reference.sourceChunk.chunkId,
          quote: reference.quote,
        })),
      };
    }),
  };
}
