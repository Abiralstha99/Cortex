import { Worker } from "bullmq";
import type { Server } from "socket.io";
import redis from "../lib/redis.js";
import {
  GAME_FINISH_JOB,
  GAME_FINISH_QUEUE,
  type GameFinishJobData,
} from "../lib/queue.js";
import { finalizeGame } from "../services/gameCompletion.service.js";

export function startGameFinishWorker(io: Server): Worker<GameFinishJobData> {
  const worker = new Worker<GameFinishJobData>(
    GAME_FINISH_QUEUE,
    async (job) => {
      if (job.name !== GAME_FINISH_JOB) return;
      await finalizeGame(job.data.gameId, job.data.finishedAt, io);
    },
    { connection: redis },
  );

  worker.on("failed", (job, error) => {
    console.error(
      `Game finalization attempt failed [gameId=${job?.data.gameId}]:`,
      error,
    );
  });

  return worker;
}
