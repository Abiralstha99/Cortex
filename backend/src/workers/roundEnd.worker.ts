// BullMQ Worker — consumes "round-end" jobs.
// It is initialised once at server startup via startRoundEndWorker(io).

import { Worker } from "bullmq";
import type { Server } from "socket.io";
import redis from "../lib/redis.js";
import { ROUND_END_QUEUE, ROUND_END_JOB } from "../lib/queue.js";
import type { RoundEndJobData } from "../lib/queue.js";
import { endRound } from "../services/roundEnd.service.js";

export function startRoundEndWorker(io: Server): Worker<RoundEndJobData> {
  const worker = new Worker<RoundEndJobData>(
    ROUND_END_QUEUE,
    async (job) => {
      if (job.name !== ROUND_END_JOB) return;

      const { gameId, roundNumber } = job.data;

      // Call endRound — if another path already ended this round,
      // the SET NX guard ensures this becomes a no-op
      await endRound(gameId, roundNumber, io);
    },
    { connection: redis },
  );

  worker.on("failed", (job, err) => {
    console.error(`round-end job failed [gameId=${job?.data.gameId}]:`, err);
  });

  return worker;
}
