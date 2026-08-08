/**
 * pipeline.ts — Quiz generation orchestrator.
 *
 * Responsibilities:
 *  1. Load an uploaded document (PDF/text) and split it into semantic chunks.
 *  2. Plan how many LLM calls are needed to produce the requested question count.
 *  3. Decide sync vs async path:
 *       - Small jobs (≤ MAX_SYNC_LLM_CALLS): generate immediately, persist to Postgres, return 200.
 *       - Large jobs: enqueue a BullMQ job, return 202 with a polling jobId.
 *  4. For each batch: call LLM → Zod-validate → retry on failure (up to MAX_GEN_RETRIES).
 *  5. Deduplicate and cap the final question set at requestedCount.
 *
 * Key invariants:
 *  - A per-owner Redis SET NX key prevents concurrent generation requests (15s TTL).
 *  - The async worker (`executeStoredGeneration`) reads its payload from Redis, not the queue message.
 *  - Postgres is only written to on *success*; failed jobs update Redis status only.
 */

import redis from "../../lib/redis.js";
import { quizGenerateQueue, QUIZ_GENERATE_JOB } from "../../lib/queue.js";
import { QUIZ_GEN_INFLIGHT_KEY } from "../../lib/redisKeys.js";
import type {
  GeneratedQuestion,
  GenerateAllBatchesResult,
  PipelinePrepareResult,
  QuestionBatch,
} from "../../types/quiz.types.js";
import { planBatches } from "./batch.service.js";
import { chunkText } from "./chunk.service.js";
import type { GenerateDeps } from "./generation.service.js";
import { callLlmForBatch } from "./generation.service.js";
import { loadDocument } from "./load.service.js";
import {
  createQuizProcessingJob,
  createReadyQuiz,
  loadQuizGenData,
  markQuizGenJobFailed,
  markQuizGenJobReady,
  storeQuizGenData,
  clearQuizGenData,
} from "./persist.service.js";
import {
  dedupeQuestions,
  parseAndValidateQuestions,
} from "./validation.service.js";

// ─── Configuration ──────────────────────────────────────────────────────────────

/** Max retry attempts per batch when Zod validation fails */
const MAX_GEN_RETRIES = Number(process.env.MAX_GEN_RETRIES ?? 3);

/** How many batches to send to the LLM concurrently */
const GEN_CONCURRENCY = Number(process.env.QUIZ_GEN_CONCURRENCY ?? 3);

/** Hard cap on questions a user can request in one generation */
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 50);

/**
 * Threshold that decides sync (≤) vs async (>) path.
 * Sync blocks the HTTP request; async returns 202 immediately.
 */
export const MAX_SYNC_LLM_CALLS = Number(process.env.MAX_SYNC_LLM_CALLS ?? 3);

// ─── Types ──────────────────────────────────────────────────────────────────────

export type RunQuizGenerationInput = {
  ownerId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  requestedCount: number;
};

export type RunQuizGenerationResult =
  | {
      mode: "sync";
      statusCode: 200;
      quizId: string;
      status: "ready";
      questions: GeneratedQuestion[];
      metadata: {
        plannedLlmCalls: number;
        requestedCount: number;
        generatedCount: number;
        sourceType: "pdf" | "text";
        title: string;
      };
    }
  | {
      mode: "async";
      statusCode: 202;
      /** Redis job id — not a Postgres quiz id until the worker finishes */
      jobId: string;
      status: "processing";
      metadata: {
        plannedLlmCalls: number;
        requestedCount: number;
        sourceType: "pdf" | "text";
        title: string;
      };
    };

// ─── Internal helpers ───────────────────────────────────────────────────────────

/**
 * Generic bounded-concurrency pool.
 * Spawns up to `concurrency` workers that pull from a shared index counter.
 * Results are returned in the original item order (not completion order).
 */
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

/**
 * Process a single batch: call the LLM, validate with Zod, retry on failure.
 *
 * Retry logic:
 *  - On Zod parse failure, the error string is fed back into the next LLM prompt
 *    so the model can self-correct.
 *  - After MAX_GEN_RETRIES failures the batch is skipped (returns []).
 *    This makes the pipeline non-fatal — partial results are acceptable.
 */
async function generateValidatedBatch(
  batch: QuestionBatch,
  batchIndex: number,
  totalBatches: number,
  deps: GenerateDeps,
): Promise<GeneratedQuestion[]> {
  let previousError: string | undefined;
  for (let attempt = 1; attempt <= MAX_GEN_RETRIES; attempt++) {
    try {
      const raw = await callLlmForBatch(
        {
          batch,
          batchIndex,
          totalBatches,
          ...(previousError !== undefined ? { previousError } : {}),
        },
        deps,
      );
      const parsed = parseAndValidateQuestions(raw);
      // Cap to requested count if the model over-generates; keep all if fewer
      return parsed.slice(0, batch.questionCount);
    } catch (err) {
      previousError = err instanceof Error ? err.message : "Unknown error";
      if (attempt === MAX_GEN_RETRIES) {
        console.warn(
          `batch ${batchIndex + 1}/${totalBatches} failed after ${MAX_GEN_RETRIES} retries: ${previousError}`,
        );
        return [];
      }
    }
  }
  return [];
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Run all planned batches concurrently, then deduplicate and trim to requestedCount.
 *
 * Used by both the sync HTTP path and the async BullMQ worker.
 */
export async function generateAllBatches(
  batches: QuestionBatch[],
  requestedCount: number,
  deps: GenerateDeps = {},
): Promise<GenerateAllBatchesResult> {
  let failedBatches = 0;
  const perBatch = await mapPool(batches, GEN_CONCURRENCY, async (batch, i) => {
    const qs = await generateValidatedBatch(batch, i, batches.length, deps);
    if (qs.length === 0) failedBatches++;
    return qs;
  });

  const flat = perBatch.flat();
  // Remove near-duplicate questions (>80% text similarity)
  const deduped = dedupeQuestions(flat);
  const questions = deduped.slice(0, requestedCount);

  return {
    questions,
    generatedCount: questions.length,
    failedBatches,
  };
}

/**
 * First stage: extract text from the uploaded file, chunk it, and plan LLM batches.
 *
 * Flow: loadDocument → chunkText → planBatches
 * Throws on invalid input (bad count, empty document, no viable chunks).
 */
export async function preparePipeline(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  requestedCount: number;
}): Promise<PipelinePrepareResult> {
  const { buffer, mimeType, originalName, requestedCount } = input;
  if (requestedCount < 1 || requestedCount > MAX_QUESTIONS) {
    throw new Error(`Requested count must be between 1 and ${MAX_QUESTIONS}`);
  }

  const text = await loadDocument({ buffer, mimeType, originalName });
  const chunks = await chunkText(text.text);

  if (chunks.length === 0) {
    throw new Error("No batches generated");
  }

  const { batches, plannedLlmCalls } = planBatches(chunks, requestedCount);

  if (plannedLlmCalls === 0) {
    throw new Error("No planned LLM calls");
  }

  return {
    title: text.title,
    sourceType: text.sourceType,
    batches,
    plannedLlmCalls,
    requestedCount,
  };
}

/**
 * Main entry point called by the HTTP controller (POST /api/quiz/generate).
 *
 * Sync/async decision gate:
 *  - plannedLlmCalls ≤ MAX_SYNC_LLM_CALLS → generate in-request, persist to Postgres, return 200.
 *  - plannedLlmCalls > MAX_SYNC_LLM_CALLS → store work in Redis, enqueue BullMQ job, return 202.
 *
 * Concurrency guard:
 *  - A SET NX key per ownerId (15s TTL) prevents the same user from double-submitting.
 *  - The key is always released in `finally`, even on error.
 */
export async function runQuizGeneration(
  input: RunQuizGenerationInput,
): Promise<RunQuizGenerationResult> {
  const { ownerId, requestedCount } = input;

  // Acquire per-user inflight lock (SET NX with 15s expiry)
  const acquired = await redis.set(
    QUIZ_GEN_INFLIGHT_KEY(ownerId),
    "1",
    "EX",
    15,
    "NX",
  );
  if (acquired !== "OK") {
    throw new Error("Quiz generation already in progress");
  }

  try {
    const pipeline = await preparePipeline(input);

    if (pipeline.plannedLlmCalls <= MAX_SYNC_LLM_CALLS) {
      // ── Sync path: small document, respond within the same HTTP request ──
      const result = await generateAllBatches(pipeline.batches, requestedCount);

      // Persist the completed quiz + questions to Postgres in one transaction
      const quiz = await createReadyQuiz({
        ownerId,
        title: pipeline.title,
        sourceType: pipeline.sourceType,
        questions: result.questions,
      });

      return {
        mode: "sync",
        statusCode: 200,
        quizId: quiz.id,
        status: "ready",
        questions: result.questions,
        metadata: {
          plannedLlmCalls: pipeline.plannedLlmCalls,
          requestedCount,
          generatedCount: result.generatedCount,
          sourceType: pipeline.sourceType,
          title: pipeline.title,
        },
      };
    } else {
      // ── Async path: large document, offload to BullMQ worker ──

      // 1. Create a pollable job status entry in Redis (status: "processing")
      const job = await createQuizProcessingJob({
        ownerId,
        title: pipeline.title,
        sourceType: pipeline.sourceType,
        requestedCount: pipeline.requestedCount,
        plannedLlmCalls: pipeline.plannedLlmCalls,
      });

      // 2. Store the full work payload (batches, metadata) in a separate Redis key
      //    so the worker can load it by jobId without passing large data through BullMQ
      await storeQuizGenData(job.jobId, {
        ownerId,
        batches: pipeline.batches,
        requestedCount: pipeline.requestedCount,
        plannedLlmCalls: pipeline.plannedLlmCalls,
        sourceType: pipeline.sourceType,
        title: pipeline.title,
      });

      // 3. Enqueue the lightweight BullMQ job (just the jobId reference)
      await quizGenerateQueue.add(QUIZ_GENERATE_JOB, { jobId: job.jobId });

      return {
        mode: "async",
        statusCode: 202,
        jobId: job.jobId,
        status: "processing",
        metadata: pipeline,
      };
    }
  } finally {
    // Always release the inflight lock so the user can retry on failure
    await redis.del(QUIZ_GEN_INFLIGHT_KEY(ownerId));
  }
}

/**
 * BullMQ worker entry point — called by quizGenerate.worker.ts.
 *
 * Flow:
 *  1. Load the work payload from Redis (batches + metadata).
 *  2. Run generateAllBatches (same logic as sync path).
 *  3. On success: persist quiz to Postgres → mark Redis job "ready" → clean up work key.
 *  4. On failure: mark Redis job "failed" with the error message (no Postgres write).
 *
 * The work payload is only cleared on success so that debugging failed jobs
 * is possible by inspecting the Redis key before TTL expiry.
 */
export async function executeStoredGeneration(jobId: string): Promise<void> {
  try {
    const work = await loadQuizGenData(jobId);
    if (!work) {
      await markQuizGenJobFailed(jobId, "Quiz generation work not found");
      return;
    }

    const { ownerId, title, sourceType } = work;

    const result = await generateAllBatches(work.batches, work.requestedCount);
    if (result.questions.length === 0) {
      await markQuizGenJobFailed(jobId, "No questions generated");
      return;
    }

    // Persist to Postgres only on success
    const quiz = await createReadyQuiz({
      ownerId,
      title,
      sourceType,
      questions: result.questions,
    });

    // Update Redis job status so the polling client sees "ready" + quizId
    await markQuizGenJobReady(jobId, quiz.id);
    // Remove the now-unnecessary work payload from Redis
    await clearQuizGenData(jobId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown generation error";
    await markQuizGenJobFailed(jobId, message);
  }
}
