import type { Round } from "../types/room.types.js";

export type QuizPlayGate = {
  id: string;
  ownerId: string;
  status: string;
  questionCount: number;
};

/**
 * Validates a quiz may be used to create a room for this host.
 * Wrong owner uses the same message as missing quiz so we do not leak existence.
 */
export function assertQuizPlayableForHost(
  quiz: QuizPlayGate | null,
  hostId: string,
): asserts quiz is QuizPlayGate {
  if (!quiz || quiz.ownerId !== hostId) {
    throw new Error("Quiz not found");
  }
  if (quiz.status !== "ready") {
    throw new Error("Quiz is not ready");
  }
  if (quiz.questionCount < 1) {
    throw new Error("Quiz has no questions");
  }
}

export function capRoundsToQuiz(
  requestedRounds: number,
  questionCount: number,
): number {
  return Math.min(requestedRounds, questionCount);
}

/** Client-safe new_question payload — never include correctIndex/explanation. */
export function publicNewQuestionPayload(round: {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  startedAt: string;
  roundNumber: number;
}): {
  roundNumber: number;
  questionId: string;
  question: string;
  options: string[];
  startedAt: string;
} {
  return {
    roundNumber: round.roundNumber,
    questionId: round.questionId,
    question: round.question,
    options: round.options,
    startedAt: round.startedAt,
  };
}

/** Type helper if callers pass a full Round. */
export function publicNewQuestionFromRound(round: Round) {
  return publicNewQuestionPayload(round);
}
