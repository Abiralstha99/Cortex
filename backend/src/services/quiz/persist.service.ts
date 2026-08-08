/**
 * persist.service.ts — Quiz persistence layer (Redis + Postgres).
 *
 * Two storage tiers:
 *  1. Redis: transient async job tracking (status polling, work payloads).
 *     - Job status keys: "processing" | "ready" | "failed" — TTL 1 hour.
 *     - Work keys: full batch payloads for the BullMQ worker — TTL 1 hour.
 *  2. Postgres: durable quiz + question storage (only written on successful generation).
 *
 * Design decision: Postgres never stores "processing" or "failed" rows.
 * If a generation fails, only Redis reflects that state. This avoids orphan
 * rows and keeps the quizzes table clean for queries/joins.
 */

import type {
  GeneratedQuestion,
  QuestionBatch,
} from "../../types/quiz.types.js";
import redis from "../../lib/redis.js";
import { QUIZ_GEN_JOB_KEY, QUIZ_GEN_WORK_KEY } from "../../lib/redisKeys.js";
import { prisma } from "../../lib/prisma.js";

// ─── Constants ──────────────────────────────────────────────────────────────────

/** All Redis keys in this module expire after 1 hour — jobs are not durable history. */
const JOB_TTL_SECONDS = 3600;

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Full work payload stored in Redis for the async BullMQ worker to consume. */
export type QuizGenWorkPayload = {
  batches: QuestionBatch[];
  requestedCount: number;
  sourceType: "pdf" | "text";
  title: string;
  ownerId: string;
  plannedLlmCalls: number;
};

/** Fields common to all job status variants. */
export type QuizGenJobBase = {
  jobId: string;
  ownerId: string;
  title: string;
  sourceType: "pdf" | "text";
  requestedCount: number;
  plannedLlmCalls: number;
  createdAt: string;
};

/**
 * Discriminated union representing the three possible states of an async quiz job.
 * The client polls GET /api/quiz/jobs/:jobId and switches on `status`.
 */
export type QuizGenJob =
  | (QuizGenJobBase & { status: "processing" })
  | (QuizGenJobBase & { status: "ready"; quizId: string })
  | (QuizGenJobBase & { status: "failed"; errorMessage: string });

// ─── Redis: Work payload (batches for the worker) ───────────────────────────────

/**
 * Store the full generation payload in Redis so the BullMQ worker can
 * retrieve it by jobId. This avoids passing large batch data through
 * the BullMQ job message itself.
 */
export async function storeQuizGenData(
  jobId: string,
  payload: QuizGenWorkPayload,
): Promise<void> {
  await redis.set(
    QUIZ_GEN_WORK_KEY(jobId),
    JSON.stringify(payload),
    "EX",
    JOB_TTL_SECONDS,
  );
}

/**
 * Load the work payload the worker needs to run generation.
 * Returns null if the key expired or was already cleared.
 */
export async function loadQuizGenData(
  jobId: string,
): Promise<QuizGenWorkPayload | null> {
  const value = await redis.get(QUIZ_GEN_WORK_KEY(jobId));
  if (!value) return null;
  return JSON.parse(value) as QuizGenWorkPayload;
}

/** Remove the work payload after successful generation (no longer needed). */
export async function clearQuizGenData(jobId: string): Promise<void> {
  await redis.del(QUIZ_GEN_WORK_KEY(jobId));
}

// ─── Redis: Job status (client-facing polling) ──────────────────────────────────

/**
 * Create a new job status entry in Redis with status "processing".
 * Returns the generated jobId for the client to poll.
 */
export async function createQuizProcessingJob(input: {
  ownerId: string;
  title: string;
  sourceType: "pdf" | "text";
  requestedCount: number;
  plannedLlmCalls: number;
}): Promise<{ jobId: string }> {
  const jobId = crypto.randomUUID();
  await redis.set(
    QUIZ_GEN_JOB_KEY(jobId),
    JSON.stringify({
      status: "processing",
      ...input,
    }),
    "EX",
    JOB_TTL_SECONDS,
  );
  return { jobId };
}

/**
 * Retrieve the current status of a quiz generation job.
 * Used by the polling endpoint to tell the client whether the job is
 * still processing, finished successfully ("ready" + quizId), or failed.
 */
export async function getQuizGenJob(jobId: string): Promise<QuizGenJob | null> {
  const value = await redis.get(QUIZ_GEN_JOB_KEY(jobId));
  if (!value) return null;
  return JSON.parse(value) as QuizGenJob;
}

/**
 * Transition job status to "ready" and attach the Postgres quiz ID.
 * Called by the worker after successfully persisting the quiz.
 */
export async function markQuizGenJobReady(
  jobId: string,
  quizId: string,
): Promise<void> {
  const result = await redis.get(QUIZ_GEN_JOB_KEY(jobId));
  if (!result) throw new Error(`Quiz generation job ${jobId} not found`);
  await redis.set(
    QUIZ_GEN_JOB_KEY(jobId),
    JSON.stringify({
      status: "ready",
      quizId,
    }),
    "EX",
    JOB_TTL_SECONDS,
  );
}

/**
 * Transition job status to "failed" with a human-readable error message.
 * Called by the worker on unrecoverable errors.
 */
export async function markQuizGenJobFailed(
  jobId: string,
  message: string,
): Promise<void> {
  const result = await redis.get(QUIZ_GEN_JOB_KEY(jobId));
  if (!result) throw new Error(`Quiz generation job ${jobId} not found`);
  await redis.set(
    QUIZ_GEN_JOB_KEY(jobId),
    JSON.stringify({
      status: "failed",
      errorMessage: message,
    }),
    "EX",
    JOB_TTL_SECONDS,
  );
}

// ─── Postgres: Quiz + Questions persistence ─────────────────────────────────────

/**
 * Atomically create a quiz and all its questions in a single Postgres transaction.
 * Prisma's nested `create` is implicitly transactional — if any question insert
 * fails, the entire operation (including the quiz row) rolls back.
 *
 * Called by both the sync HTTP path and the async BullMQ worker on success.
 */
export async function createReadyQuiz(input: {
  ownerId: string;
  title: string;
  sourceType: "pdf" | "text";
  questions: GeneratedQuestion[];
}): Promise<{ id: string; questionCount: number }> {
  const { ownerId, title, sourceType, questions } = input;

  const quiz = await prisma.quiz.create({
    data: {
      ownerId,
      title,
      sourceType,
      status: "ready",
      questionCount: questions.length,
      questions: {
        create: questions.map((q, index) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          position: index,
        })),
      },
    },
    select: { id: true, questionCount: true },
  });

  return quiz;
}

/**
 * Fetch a single quiz with all its questions (ordered by position).
 * Scoped to ownerId so users can only access their own quizzes.
 * Returns null if not found or if the quiz belongs to another user.
 */
export async function getQuiz(quizId: string, ownerId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, ownerId },
    include: {
      questions: { orderBy: { position: "asc" } },
    },
  });

  return quiz;
}

/**
 * List all ready quizzes for a user, newest first.
 * Only returns summary fields suitable for a list view (no question bodies).
 * Filters to status "ready" to exclude any legacy processing/failed rows.
 */
export async function getAllQuizzes(ownerId: string) {
  const quizzes = await prisma.quiz.findMany({
    where: { ownerId, status: "ready" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      sourceType: true,
      questionCount: true,
      createdAt: true,
    },
  });
  return quizzes;
}
