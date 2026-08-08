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

// Quiz generation (async path when plannedLlmCalls > MAX_SYNC_LLM_CALLS).
// jobId indexes Redis quiz-gen:job / quiz-gen:work — not a Postgres quiz id.
export interface QuizGenerateJobData {
  jobId: string;
}

export const QUIZ_GENERATE_QUEUE = "quiz-generate";
export const QUIZ_GENERATE_JOB = "generate-quiz";

export const quizGenerateQueue = new Queue<QuizGenerateJobData>(
  QUIZ_GENERATE_QUEUE,
  { connection: redis },
);
