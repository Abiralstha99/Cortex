import { createHash, randomInt } from "node:crypto";
import redis from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { QuestionContentSchema } from "../schemas/quiz.js";
import type { QuestionContent } from "./questionAnswer.service.js";
import { QUIZ_QUESTIONS_KEY } from "../lib/redisKeys.js";

export const QUIZ_CACHE_TTL_SECONDS = 3 * 60 * 60;

export type CachedQuestion = QuestionContent & {
  id: string;
  question: string;
  explanation: string;
};

export type QuizSnapshot = {
  version: string;
  questions: CachedQuestion[];
};

type QuestionRow = { id: string; question: string; type: string; content: unknown; explanation: string };
type QuestionLoader = (quizId: string) => Promise<QuestionRow[]>;

const loadFromPostgres: QuestionLoader = (quizId) => prisma.question.findMany({
  where: { quizId },
  orderBy: { position: "asc" },
  select: { id: true, question: true, type: true, content: true, explanation: true },
});

function validateQuestions(rows: QuestionRow[]): CachedQuestion[] {
  if (rows.length === 0) throw new Error("Quiz has no questions");
  return rows.map((row) => {
    const parsed = QuestionContentSchema.safeParse({ type: row.type, content: row.content });
    if (!parsed.success) throw new Error(`Invalid question ${row.id} in quiz`);
    return { id: row.id, question: row.question, explanation: row.explanation, ...parsed.data };
  });
}

function snapshotFromQuestions(questions: CachedQuestion[]): QuizSnapshot {
  return {
    version: createHash("sha256").update(JSON.stringify(questions)).digest("hex"),
    questions,
  };
}

function parseSnapshot(raw: string): QuizSnapshot {
  const parsed = JSON.parse(raw) as QuizSnapshot;
  const questions = validateQuestions(parsed.questions);
  const snapshot = snapshotFromQuestions(questions);
  if (parsed.version !== snapshot.version) throw new Error("Invalid quiz cache version");
  return snapshot;
}

/** Loads one shared snapshot. A pinned game refuses changed data after a cache miss. */
export async function getQuizQuestions(
  quizId: string,
  loader: QuestionLoader = loadFromPostgres,
  expectedVersion?: string,
): Promise<QuizSnapshot> {
  const key = QUIZ_QUESTIONS_KEY(quizId);
  let raw = await redis.get(key);
  if (!raw) {
    const questions = validateQuestions(await loader(quizId));
    const candidate = JSON.stringify(snapshotFromQuestions(questions));
    const stored = await redis.set(key, candidate, "EX", QUIZ_CACHE_TTL_SECONDS, "NX");
    raw = stored === "OK" ? candidate : await redis.get(key);
    if (!raw) throw new Error("Quiz cache unavailable");
  }
  const snapshot = parseSnapshot(raw);
  if (expectedVersion && snapshot.version !== expectedVersion) {
    throw new Error("Quiz questions changed during an active game");
  }
  await redis.expire(key, QUIZ_CACHE_TTL_SECONDS);
  return snapshot;
}

export function shuffleQuestionIds(ids: string[]): string[] {
  const order = [...ids];
  for (let index = order.length - 1; index > 0; index--) {
    const swapIndex = randomInt(index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex]!, order[index]!];
  }
  return order;
}
