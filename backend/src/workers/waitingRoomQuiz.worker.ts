import { Worker } from "bullmq";
import redis from "../lib/redis.js";
import {
  ATTACH_QUIZ_TO_WAITING_GAME_JOB,
  FAIL_WAITING_QUIZ_GENERATION_JOB,
  WAITING_ROOM_QUIZ_QUEUE,
  type WaitingRoomQuizJobData,
} from "../lib/queue.js";
import {
  attachQuizToWaitingGame,
  markWaitingQuizFailed,
  type WaitingQuizStatusPayload,
} from "../services/waitingQuiz.service.js";
import { refreshPublicWaitingRoom } from "../services/publicWaitingFeed.service.js";
import { getIO } from "../socket/index.js";

function isTerminalRoomAttachmentError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "Room not found" || error.message === "Room is not waiting")
  );
}

export function startWaitingRoomQuizWorker(): Worker<WaitingRoomQuizJobData> {
  const worker = new Worker<WaitingRoomQuizJobData>(
    WAITING_ROOM_QUIZ_QUEUE,
    async (job) => {
      if (job.name === ATTACH_QUIZ_TO_WAITING_GAME_JOB && job.data.type === "attach") {
        try {
          const payload = await attachQuizToWaitingGame(
            job.data.gameId,
            job.data.quizId,
            job.data.questionCount,
          );
          publishWaitingQuizStatus(job.data.gameId, payload);
        } catch (error) {
          if (isTerminalRoomAttachmentError(error)) return;
          throw error;
        }
        return;
      }

      if (job.name === FAIL_WAITING_QUIZ_GENERATION_JOB && job.data.type === "fail") {
        const payload = await markWaitingQuizFailed(job.data.gameId, job.data.message);
        if (payload) publishWaitingQuizStatus(job.data.gameId, payload);
      }
    },
    { connection: redis },
  );

  worker.on("failed", (job, error) => {
    console.error(
      `waiting-room quiz job failed [jobId=${job?.id ?? "unknown"}]:`,
      error,
    );
  });

  return worker;
}

function publishWaitingQuizStatus(
  gameId: string,
  payload: WaitingQuizStatusPayload,
): void {
  const io = getIO();
  io.to(`game:${gameId}`).emit("quiz_status", payload);
  refreshPublicWaitingRoom(io, gameId);
}
