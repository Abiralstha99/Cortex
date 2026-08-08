// BullMQ Worker — consumes "quiz-generate" jobs.
// Initialised once at server startup via startQuizGenerateWorker().

import { Worker } from "bullmq";
import redis from "../lib/redis.js";
import {
  QUIZ_GENERATE_QUEUE,
  QUIZ_GENERATE_JOB,
  type QuizGenerateJobData,
} from "../lib/queue.js";
import { executeStoredGeneration } from "../services/quiz/pipeline.js";

export function startQuizGenerateWorker(): Worker<QuizGenerateJobData> {
  const worker = new Worker<QuizGenerateJobData>(
    QUIZ_GENERATE_QUEUE,
    async (job) => {
      if (job.name !== QUIZ_GENERATE_JOB) return;
      // Task 11: fully wired when executeStoredGeneration is implemented
      await executeStoredGeneration(job.data.jobId);
    },
    { connection: redis },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `quiz-generate job failed [jobId=${job?.data.jobId}]:`,
      err,
    );
  });

  return worker;
}
