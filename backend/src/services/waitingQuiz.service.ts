import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import type { QuizGenStatus } from "../types/room.types.js";
import { capRoundsToQuiz } from "./gamePlay.helpers.js";
import { runQuizGeneration } from "./quiz/pipeline.js";

export type WaitingQuizStatusPayload = {
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

export async function setWaitingQuizJobIdIfProcessing(
  gameId: string,
  jobId: string,
): Promise<boolean> {
  const updated = await redis.eval(
    `
      if redis.call("HGET", KEYS[1], "status") ~= "waiting" then
        return 0
      end
      if redis.call("HGET", KEYS[1], "quizGenStatus") ~= "processing" then
        return 0
      end
      redis.call("HSET", KEYS[1], "quizGenJobId", ARGV[1])
      return 1
    `,
    1,
    GAME_KEY(gameId),
    jobId,
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
  console.info("[quiz-gen] waiting-room:attach", {
    gameId,
    quizId,
    quizQuestionCount: questionCount,
    configuredRoundCount: Number(raw.numberOfRounds),
    attachedRoundCount: capped,
  });
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
  title?: string;
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
        gameId,
        ...(input.title !== undefined ? { title: input.title } : {}),
      });

      await setWaitingQuizJobIdIfProcessing(gameId, result.jobId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed";
      const failed = await markWaitingQuizFailed(gameId, message);
      if (failed) onStatus(failed);
    }
  });
}
