import type { QuizGenStatus } from "../types/room.types.js";
import { normalizeWaitingQuizId } from "./gamePlay.helpers.js";

export function waitingQuizPublicState(input: {
  quizId?: string | null;
  quizGenStatus?: string | null;
  quizGenError?: string | null;
}): {
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
} {
  const quizId = normalizeWaitingQuizId(input.quizId);
  const rawStatus = input.quizGenStatus?.trim();
  const status: QuizGenStatus = rawStatus
    ? (rawStatus as QuizGenStatus)
    : quizId
      ? "ready"
      : "none";
  const error =
    status === "failed" && input.quizGenError?.trim()
      ? input.quizGenError.trim()
      : null;
  return {
    quizId,
    quizGenStatus: status,
    quizGenError: error,
  };
}
