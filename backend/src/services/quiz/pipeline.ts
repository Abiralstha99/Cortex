/**
 * pipeline.ts — Quiz generation orchestrator.
 *
 * Responsibilities:
 *  1. Load an uploaded document (PDF/text) and split it into semantic chunks.
 *  2. Queue a sequential adaptive generation run.
 *  3. Persist only a complete, validated question set.
 *
 * Key invariants:
 *  - A per-owner Redis SET NX key prevents concurrent generation requests (15s TTL).
 *  - The async worker (`executeStoredGeneration`) reads its payload from Redis, not the queue message.
 *  - Postgres is only written to on *success*; failed jobs update Redis status only.
 */

import redis from "../../lib/redis.js";
import {
  ATTACH_QUIZ_TO_WAITING_GAME_JOB,
  FAIL_WAITING_QUIZ_GENERATION_JOB,
  quizGenerateQueue,
  QUIZ_GENERATE_JOB,
  waitingRoomQuizQueue,
} from "../../lib/queue.js";
import { QUIZ_GEN_INFLIGHT_KEY } from "../../lib/redisKeys.js";
import type {
  AdaptiveQuizGenerationInput,
  AdaptiveQuizGenerationResult,
  BatchOutcome,
  BatchValidationOutcome,
  GeminiGenerationConfig,
  GeneratedQuestion,
  QuestionBatch,
} from "../../types/quiz.types.js";
import {
  DEFAULT_BATCH_TOKEN_BUDGET,
  packSourceChunks,
} from "./batch.service.js";
import { chunkText } from "./chunk.service.js";
import type { AdaptiveGenerateDeps } from "./generation.service.js";
import { callLlmForBatch } from "./generation.service.js";
import { loadDocument } from "./load.service.js";
import { createAdaptivePlanner } from "./adaptive-planner.service.js";
import {
  createQuizProcessingJob,
  createReadyQuiz,
  loadQuizGenData,
  markQuizGenJobFailed,
  markQuizGenJobReady,
  recordPersistedQuizGenData,
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

/** Hard cap on questions a user can request in one generation */
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 50);

export class QuizGenerationIncompleteError extends Error {
  constructor(
    public readonly requestedCount: number,
    public readonly generatedCount: number,
    cause?: unknown,
  ) {
    super(
      `Quiz generation incomplete: generated ${generatedCount} of ${requestedCount} requested questions`,
      cause === undefined ? undefined : { cause },
    );
    this.name = "QuizGenerationIncompleteError";
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export type RunQuizGenerationInput = {
  ownerId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  requestedCount: number;
  /** When set, overrides the filename-derived title stored on the quiz. */
  title?: string;
  gameId?: string;
};

export type RunQuizGenerationResult = {
  mode: "async";
  statusCode: 202;
  /** Redis job id — not a Postgres quiz id until the worker finishes */
  jobId: string;
  status: "processing";
  metadata: {
    requestedCount: number;
    sourceType: "pdf" | "text";
    title: string;
  };
};

/**
 * Generates exactly the requested number of unique questions by adapting each
 * request to the outcome of the previous one.
 */
export async function generateAdaptiveQuiz(
  input: AdaptiveQuizGenerationInput,
  deps: AdaptiveGenerateDeps = {},
): Promise<AdaptiveQuizGenerationResult> {
  const startedAt = Date.now();
  const sourcePacks = packSourceChunks(
    input.chunks,
    Number(process.env.QUIZ_BATCH_TOKEN_BUDGET ?? DEFAULT_BATCH_TOKEN_BUDGET),
  );
  const planner = createAdaptivePlanner({
    sourcePacks,
    requestedTotal: input.requestedCount,
    usableOutputBudget: input.modelConfig.usableOutputBudget,
  });
  const questions: GeneratedQuestion[] = [];
  const batchSizes: number[] = [];
  const outputTokensByBatch: Array<number | undefined> = [];
  const tokensPerQuestionByBatch: Array<number | undefined> = [];
  const finishReasons: Array<string | undefined> = [];
  const validationOutcomes: BatchValidationOutcome[] = [];
  let retries = 0;
  let totalLlmCalls = 0;

  try {
    while (planner.hasRemainingQuestions()) {
      const planned = planner.nextBatch();
      const batch: QuestionBatch = {
        text: planned.sourcePack.text,
        chunkIndices: planned.sourcePack.chunkIndices,
        chunks: planned.sourcePack.chunks,
        questionCount: planned.questionCount,
      };
      const result = await generateAdaptiveBatch(
        batch,
        totalLlmCalls,
        input.modelConfig,
        deps,
        questions,
      );

      batchSizes.push(...result.batchSizes);
      outputTokensByBatch.push(...result.outputTokensByBatch);
      tokensPerQuestionByBatch.push(...result.tokensPerQuestionByBatch);
      finishReasons.push(...result.finishReasons);
      validationOutcomes.push(...result.validationOutcomes);
      retries += result.retries;
      totalLlmCalls += result.totalLlmCalls;

      console.info("[quiz-gen] run:batch", {
        runId: input.runId,
        batchIndex: totalLlmCalls - result.totalLlmCalls,
        outcome: result.outcome,
        retries: result.retries,
        totalLlmCalls: result.totalLlmCalls,
      });

      planner.recordOutcome(result.outcome);
    }
  } catch (error) {
    if (error instanceof QuizGenerationIncompleteError) throw error;
    throw new QuizGenerationIncompleteError(
      input.requestedCount,
      questions.length,
      error,
    );
  }

  const state = planner.getState();
  const generated = {
    questions,
    complete: questions.length === input.requestedCount,
    metrics: {
      resolvedModel: input.modelConfig.model,
      configuredMaxOutputTokens: input.modelConfig.maxOutputTokens,
      usableOutputBudget: input.modelConfig.usableOutputBudget,
      requestedTotal: input.requestedCount,
      batchSizes,
      outputTokensByBatch,
      tokensPerQuestionByBatch,
      finishReasons,
      validationOutcomes,
      retries,
      failedBatches: state.failedBatchCount,
      successfulBatchCount: state.successfulBatchCount,
      totalLlmCalls,
      durationMs: Date.now() - startedAt,
      finalGeneratedCount: questions.length,
    },
  };
  console.info("[quiz-gen] run:complete", {
    runId: input.runId,
    complete: generated.complete,
    metrics: generated.metrics,
  });
  return generated;
}

type AdaptiveBatchResult = {
  outcome: BatchOutcome;
  batchSizes: number[];
  outputTokensByBatch: Array<number | undefined>;
  tokensPerQuestionByBatch: Array<number | undefined>;
  finishReasons: Array<string | undefined>;
  validationOutcomes: BatchValidationOutcome[];
  retries: number;
  totalLlmCalls: number;
};

async function generateAdaptiveBatch(
  batch: QuestionBatch,
  batchIndex: number,
  modelConfig: GeminiGenerationConfig,
  deps: AdaptiveGenerateDeps,
  acceptedQuestions: GeneratedQuestion[],
): Promise<AdaptiveBatchResult> {
  let previousError: string | undefined;
  const metrics = {
    batchSizes: [] as number[],
    outputTokensByBatch: [] as Array<number | undefined>,
    tokensPerQuestionByBatch: [] as Array<number | undefined>,
    finishReasons: [] as Array<string | undefined>,
    validationOutcomes: [] as BatchValidationOutcome[],
    retries: 0,
    totalLlmCalls: 0,
  };

  for (let attempt = 1; attempt <= MAX_GEN_RETRIES; attempt++) {
    let finishReason: string | undefined;
    let outputTokens: number | undefined;
    let validationOutcome: BatchValidationOutcome = "provider-error";

    try {
      const response = await callLlmForBatch(
        {
          batch,
          batchIndex,
          ...(previousError === undefined ? {} : { previousError }),
        },
        modelConfig,
        deps,
      );
      finishReason = response.finishReason;
      outputTokens = response.outputTokens;

      if (finishReason === "length") {
        validationOutcome = "capacity-failure";
        return failedAdaptiveBatch(batch.questionCount, finishReason, outputTokens, validationOutcome, metrics);
      }

      const parsed = parseAndValidateQuestions(response.text, batch.chunks);
      if (parsed.length !== batch.questionCount) {
        validationOutcome = "count-mismatch";
        previousError = `Expected ${batch.questionCount} questions, received ${parsed.length}`;
      } else {
        const deduped = dedupeQuestions([...acceptedQuestions, ...parsed]);
        const uniqueQuestions = deduped.slice(acceptedQuestions.length);
        acceptedQuestions.push(...uniqueQuestions);
        validationOutcome = "valid";
        recordAdaptiveCall(metrics, batch.questionCount, finishReason, outputTokens, validationOutcome);
        return {
          ...metrics,
          outcome: {
            requestedQuestionCount: batch.questionCount,
            generatedQuestionCount: parsed.length,
            uniqueQuestionCount: uniqueQuestions.length,
            outputTokens,
            finishReason,
            validationOutcome,
            healthy: true,
            retried: attempt > 1,
          },
        };
      }
    } catch (error) {
      previousError = error instanceof Error ? error.message : "Question validation failed";
      validationOutcome = previousError === "Response was not valid JSON"
        ? "invalid-json"
        : previousError.includes("Question validation failed")
          ? "schema-invalid"
          : "provider-error";
    }

    recordAdaptiveCall(metrics, batch.questionCount, finishReason, outputTokens, validationOutcome);
    if (attempt < MAX_GEN_RETRIES) {
      metrics.retries++;
      continue;
    }
  }

  return failedAdaptiveBatch(
    batch.questionCount,
    metrics.finishReasons.at(-1),
    metrics.outputTokensByBatch.at(-1),
    metrics.validationOutcomes.at(-1) ?? "provider-error",
    metrics,
    false,
  );
}

function recordAdaptiveCall(
  metrics: Omit<AdaptiveBatchResult, "outcome">,
  requestedQuestionCount: number,
  finishReason: string | undefined,
  outputTokens: number | undefined,
  validationOutcome: BatchValidationOutcome,
): void {
  metrics.batchSizes.push(requestedQuestionCount);
  metrics.outputTokensByBatch.push(outputTokens);
  metrics.tokensPerQuestionByBatch.push(
    validationOutcome === "valid" && outputTokens !== undefined
      ? outputTokens / requestedQuestionCount
      : undefined,
  );
  metrics.finishReasons.push(finishReason);
  metrics.validationOutcomes.push(validationOutcome);
  metrics.totalLlmCalls++;
}

function failedAdaptiveBatch(
  requestedQuestionCount: number,
  finishReason: string | undefined,
  outputTokens: number | undefined,
  validationOutcome: BatchValidationOutcome,
  metrics: Omit<AdaptiveBatchResult, "outcome">,
  recordCall = true,
): AdaptiveBatchResult {
  if (recordCall) {
    recordAdaptiveCall(
      metrics,
      requestedQuestionCount,
      finishReason,
      outputTokens,
      validationOutcome,
    );
  }
  return {
    ...metrics,
    outcome: {
      requestedQuestionCount,
      generatedQuestionCount: 0,
      uniqueQuestionCount: 0,
      outputTokens,
      finishReason,
      validationOutcome,
      healthy: false,
      retried: metrics.retries > 0,
    },
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * First stage: extract text from the uploaded file and split it into source chunks.
 *
 * Flow: loadDocument → chunkText
 * Throws on invalid input (bad count, empty document, no viable chunks).
 */
export async function preparePipeline(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  requestedCount: number;
  title?: string;
}): Promise<{
  title: string;
  sourceType: "pdf" | "text";
  chunks: string[];
  requestedCount: number;
}> {
  const { buffer, mimeType, originalName, requestedCount, title } = input;
  if (requestedCount < 1 || requestedCount > MAX_QUESTIONS) {
    throw new Error(`Requested count must be between 1 and ${MAX_QUESTIONS}`);
  }

  const text = await loadDocument({ buffer, mimeType, originalName });
  const chunks = await chunkText(text.text);

  console.info("[quiz-gen] pipeline:prepared-source", {
    sourceType: text.sourceType,
    sourceCharacterCount: text.text.length,
    chunkCount: chunks.length,
    requestedCount,
  });

  if (chunks.length === 0) {
    throw new Error("No source chunks generated");
  }

  const trimmedTitle = title?.trim().slice(0, 255);

  return {
    title: trimmedTitle || text.title,
    sourceType: text.sourceType,
    chunks,
    requestedCount,
  };
}

/**
 * Main entry point called by the HTTP controller (POST /api/quiz/generate).
 *
 * Every request is stored in Redis and dispatched to the adaptive worker.
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

    console.info("[quiz-gen] run:dispatch", {
      requestedCount,
      mode: "async",
    });

    const job = await createQuizProcessingJob({
      ownerId,
      title: pipeline.title,
      sourceType: pipeline.sourceType,
      requestedCount: pipeline.requestedCount,
    });

    // Store source chunks and metadata separately so the worker can load
    // the work by jobId without passing a large payload through BullMQ.
    await storeQuizGenData(job.jobId, {
      ownerId,
      chunks: pipeline.chunks,
      requestedCount: pipeline.requestedCount,
      sourceType: pipeline.sourceType,
      title: pipeline.title,
      ...(input.gameId === undefined ? {} : { gameId: input.gameId }),
    });

    // Enqueue the lightweight BullMQ job (just the jobId reference).
    await quizGenerateQueue.add(QUIZ_GENERATE_JOB, { jobId: job.jobId });

    return {
      mode: "async",
      statusCode: 202,
      jobId: job.jobId,
      status: "processing",
      metadata: {
        requestedCount: pipeline.requestedCount,
        sourceType: pipeline.sourceType,
        title: pipeline.title,
      },
    };
  } finally {
    // Always release the inflight lock so the user can retry on failure
    await redis.del(QUIZ_GEN_INFLIGHT_KEY(ownerId));
  }
}

/**
 * BullMQ worker entry point — called by quizGenerate.worker.ts.
 *
 * Flow:
 *  1. Load the work payload from Redis (source chunks + metadata).
 *  2. Run sequential adaptive generation.
 *  3. On success: persist quiz to Postgres → mark Redis job "ready" → clean up work key.
 *  4. On failure: mark Redis job "failed" with the error message (no Postgres write).
 *
 * The work payload is only cleared on success so that debugging failed jobs
 * is possible by inspecting the Redis key before TTL expiry.
 */
export async function executeStoredGeneration(
  jobId: string,
  modelConfig: GeminiGenerationConfig,
): Promise<void> {
  return executeStoredGenerationWithDeps(jobId, modelConfig);
}

export type StoredGenerationDeps = {
  loadWork: typeof loadQuizGenData;
  generateQuiz: typeof generateAdaptiveQuiz;
  persistQuiz: typeof createReadyQuiz;
  recordPersistedQuiz: typeof recordPersistedQuizGenData;
  markReady: typeof markQuizGenJobReady;
  markFailed: typeof markQuizGenJobFailed;
  clearWork: typeof clearQuizGenData;
  enqueueWaitingRoomJob: (
    name: string,
    data: Parameters<typeof waitingRoomQuizQueue.add>[1],
  ) => Promise<unknown>;
};

const storedGenerationDeps: StoredGenerationDeps = {
  loadWork: loadQuizGenData,
  generateQuiz: generateAdaptiveQuiz,
  persistQuiz: createReadyQuiz,
  recordPersistedQuiz: recordPersistedQuizGenData,
  markReady: markQuizGenJobReady,
  markFailed: markQuizGenJobFailed,
  clearWork: clearQuizGenData,
  enqueueWaitingRoomJob: (name, data) =>
    waitingRoomQuizQueue.add(name, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
  }),
};

async function generateAndPersistQuiz(
  jobId: string,
  work: NonNullable<Awaited<ReturnType<typeof loadQuizGenData>>>,
  modelConfig: GeminiGenerationConfig,
  deps: StoredGenerationDeps,
): Promise<{ id: string; questionCount: number }> {
  const result = await deps.generateQuiz({
    chunks: work.chunks,
    requestedCount: work.requestedCount,
    modelConfig,
  });
  if (!result.complete || result.questions.length !== work.requestedCount) {
    throw new QuizGenerationIncompleteError(
      work.requestedCount,
      result.questions.length,
    );
  }

  const quiz = await deps.persistQuiz({
    ownerId: work.ownerId,
    title: work.title,
    sourceType: work.sourceType,
    questions: result.questions,
    chunks: work.chunks,
  });
  await deps.recordPersistedQuiz(jobId, quiz);
  return quiz;
}

export async function executeStoredGenerationWithDeps(
  jobId: string,
  modelConfig: GeminiGenerationConfig,
  deps: StoredGenerationDeps = storedGenerationDeps,
): Promise<void> {
  let gameId: string | undefined;
  let generationPersisted = false;
  let generationReady = false;
  try {
    const work = await deps.loadWork(jobId);
    if (!work) {
      await deps.markFailed(jobId, "Quiz generation work not found");
      return;
    }

    gameId = work.gameId;

    if (!work.chunks) {
      throw new Error("Adaptive quiz generation work is incomplete");
    }
    const quiz = work.persistedQuizId && work.persistedQuestionCount
      ? {
          id: work.persistedQuizId,
          questionCount: work.persistedQuestionCount,
        }
      : await generateAndPersistQuiz(jobId, work, modelConfig, deps);
    generationPersisted = true;

    // Update Redis job status so the polling client sees "ready" + quizId
    await deps.markReady(jobId, quiz.id);
    generationReady = true;
    if (gameId) {
      await deps.enqueueWaitingRoomJob(
        ATTACH_QUIZ_TO_WAITING_GAME_JOB,
        {
          type: "attach",
          gameId,
          quizId: quiz.id,
          questionCount: quiz.questionCount,
        },
      );
    }
    // Remove the now-unnecessary work payload from Redis
    await deps.clearWork(jobId);
  } catch (error) {
    if (generationPersisted || generationReady) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Unknown generation error";
    await deps.markFailed(jobId, message);
    if (gameId) {
      await deps.enqueueWaitingRoomJob(
        FAIL_WAITING_QUIZ_GENERATION_JOB,
        { type: "fail", gameId, message },
      );
    }
  }
}
