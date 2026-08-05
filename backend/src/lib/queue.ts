import { Queue } from "bullmq";
import redis from "./redis.js";

// Defines the data for the job that will be enqueued.
export interface RoundEndJobData {
  gameId: string;
  roundNumber: number;
}

// Queue and job names.
export const ROUND_END_QUEUE = "round-end";
export const ROUND_END_JOB = "end-round";

export const roundEndQueue = new Queue<RoundEndJobData>(ROUND_END_QUEUE, {
  connection: redis,
});
