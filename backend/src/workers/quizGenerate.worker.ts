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
import type { ModelGenerationConfig } from "../services/quiz/model-config.service.js";

export function startQuizGenerateWorker(
  modelConfig: ModelGenerationConfig,
): Worker<QuizGenerateJobData> {
  const worker = new Worker<QuizGenerateJobData>(
    QUIZ_GENERATE_QUEUE,
    async (job) => {
      if (job.name !== QUIZ_GENERATE_JOB) return;
      console.info("[quiz-gen] worker:start", {
        jobId: job.data.jobId,
      });
      await executeStoredGeneration(job.data.jobId, modelConfig);
      console.info("[quiz-gen] worker:complete", {
        jobId: job.data.jobId,
      });
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
