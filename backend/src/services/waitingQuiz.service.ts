import redis from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import type { QuizGenStatus } from "../types/room.types.js";
import { capRoundsToQuiz } from "./gamePlay.helpers.js";
import { runQuizGeneration } from "./quiz/pipeline.js";

type WaitingQuizStatusPayload = {
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
  numberOfRounds?: number;
};

export async function setWaitingQuizFields(
  gameId: string,
  fields: Record<string, string>,
): Promise<boolean> {
  const entries = Object.entries(fields).flatMap(([field, value]) => [
    field,
    value,
  ]);
  if (entries.length === 0) return true;

  const updated = await redis.eval(
    `
      if redis.call("HGET", KEYS[1], "status") ~= "waiting" then
        return 0
      end
      for index = 1, #ARGV, 2 do
        redis.call("HSET", KEYS[1], ARGV[index], ARGV[index + 1])
      end
      return 1
    `,
    1,
    GAME_KEY(gameId),
    ...entries,
  );

  return updated === 1;
}

export async function attachQuizToWaitingGame(
  gameId: string,
  quizId: string,
  questionCount: number,
): Promise<WaitingQuizStatusPayload> {
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw?.gameId) throw new Error("Room not found");
  if (raw.status !== "waiting") throw new Error("Room is not waiting");

  const capped = capRoundsToQuiz(Number(raw.numberOfRounds), questionCount);
  const updated = await setWaitingQuizFields(gameId, {
    quizId,
    quizGenStatus: "ready",
    quizGenJobId: "",
    quizGenError: "",
    numberOfRounds: String(capped),
  });
  if (!updated) throw new Error("Room is not waiting");

  return {
    quizId,
    quizGenStatus: "ready",
    quizGenError: null,
    numberOfRounds: capped,
  };
}

export async function markWaitingQuizFailed(
  gameId: string,
  message: string,
): Promise<WaitingQuizStatusPayload | null> {
  const safeMessage = message.slice(0, 500);
  const updated = await setWaitingQuizFields(gameId, {
    quizId: "",
    quizGenStatus: "failed",
    quizGenJobId: "",
    quizGenError: safeMessage,
  });
  if (!updated) return null;

  return {
    quizId: null,
    quizGenStatus: "failed",
    quizGenError: safeMessage,
  };
}

/**
 * Schedules generation after room creation so the room code can be returned
 * before document processing begins.
 */
export function scheduleWaitingQuizGeneration(input: {
  gameId: string;
  ownerId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  requestedCount: number;
  onStatus: (payload: WaitingQuizStatusPayload) => void;
}) {
  const { gameId, onStatus } = input;

  setImmediate(async () => {
    try {
      const started = await setWaitingQuizFields(gameId, {
        quizGenStatus: "processing",
        quizGenError: "",
        quizId: "",
      });
      if (!started) return;
      onStatus({
        quizId: null,
        quizGenStatus: "processing",
        quizGenError: null,
      });

      const result = await runQuizGeneration({
        ownerId: input.ownerId,
        buffer: input.buffer,
        mimeType: input.mimeType,
        originalName: input.originalName,
        requestedCount: input.requestedCount,
      });

      if (result.mode === "async") {
        const jobAttached = await setWaitingQuizFields(gameId, {
          quizGenStatus: "processing",
          quizGenJobId: result.jobId,
        });
        if (!jobAttached) return;

        const { getQuizGenJob } = await import("./quiz/persist.service.js");
        for (let attempt = 0; attempt < 90; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const job = await getQuizGenJob(result.jobId);
          if (!job) continue;

          if (job.status === "ready") {
            const quiz = await prisma.quiz.findUnique({
              where: { id: job.quizId },
              select: { questionCount: true },
            });
            const questionCount =
              quiz?.questionCount ?? input.requestedCount;
            const attached = await attachQuizToWaitingGame(
              gameId,
              job.quizId,
              questionCount,
            );
            onStatus(attached);
            return;
          }

          if (job.status === "failed") {
            const failed = await markWaitingQuizFailed(
              gameId,
              job.errorMessage || "Generation failed",
            );
            if (failed) onStatus(failed);
            return;
          }
        }

        const failed = await markWaitingQuizFailed(
          gameId,
          "Generation timed out",
        );
        if (failed) onStatus(failed);
        return;
      }

      if (!result.quizId || result.questions.length === 0) {
        const failed = await markWaitingQuizFailed(
          gameId,
          "No questions generated",
        );
        if (failed) onStatus(failed);
        return;
      }

      const attached = await attachQuizToWaitingGame(
        gameId,
        result.quizId,
        result.questions.length,
      );
      onStatus(attached);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed";
      const failed = await markWaitingQuizFailed(gameId, message);
      if (failed) onStatus(failed);
    }
  });
}
