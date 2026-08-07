import type { QuestionBatch } from "../../types/quiz.types.js";
import { estimateTokens } from "./tokens.js";

export const DEFAULT_BATCH_TOKEN_BUDGET = 3000;
export const DEFAULT_MAX_QUESTIONS_PER_BATCH = 8;

export type PlanBatchesOptions = {
  tokenBudget?: number;
  maxQuestionsPerBatch?: number;
};

type Packed = { text: string; chunkIndices: number[]; tokens: number };

export function planBatches(
  chunks: string[],
  requestedCount: number,
  options: PlanBatchesOptions = {},
): { batches: QuestionBatch[]; plannedLlmCalls: number } {
  const tokenBudget =
    options.tokenBudget ??
    Number(process.env.QUIZ_BATCH_TOKEN_BUDGET ?? DEFAULT_BATCH_TOKEN_BUDGET);
  const maxQuestionsPerBatch =
    options.maxQuestionsPerBatch ?? DEFAULT_MAX_QUESTIONS_PER_BATCH;

  if (chunks.length === 0) {
    return { batches: [], plannedLlmCalls: 0 };
  }

  const count = Math.max(1, requestedCount);

  // Pack chunks into text batches by token budget
  const packed: Packed[] = [];
  let current: Packed | null = null;

  chunks.forEach((chunk, index) => {
    const t = estimateTokens(chunk);
    if (!current) {
      current = { text: chunk, chunkIndices: [index], tokens: t };
      return;
    }
    if (current.tokens + t > tokenBudget) {
      packed.push(current);
      current = { text: chunk, chunkIndices: [index], tokens: t };
    } else {
      current.text = `${current.text}\n\n---\n\n${chunk}`;
      current.chunkIndices.push(index);
      current.tokens += t;
    }
  });
  if (current) packed.push(current);

  // If we need more batches than packed to honor maxQuestionsPerBatch, split text batches further by question slots only when single packed has too many Qs
  // First distribute questions proportionally across packed batches
  const lengths = packed.map((p) => Math.max(1, p.tokens));
  const totalLen = lengths.reduce((a, b) => a + b, 0);

  let rawCounts = packed.map((p) =>
    Math.max(1, Math.round((p.tokens / totalLen) * count)),
  );

  // Fix sum to equal count
  let sum = rawCounts.reduce((a, b) => a + b, 0);
  while (sum > count) {
    const i = rawCounts.indexOf(Math.max(...rawCounts));
    if (rawCounts[i]! > 1) {
      rawCounts[i]!--;
      sum--;
    } else break;
  }
  while (sum < count) {
    const i = lengths.indexOf(Math.max(...lengths));
    rawCounts[i]!++;
    sum++;
  }

  // Split any batch whose questionCount > max into multiple identical-text batches (same material, fewer Q each) so one LLM call stays bounded
  const batches: QuestionBatch[] = [];
  packed.forEach((p, i) => {
    let remaining = rawCounts[i]!;
    while (remaining > 0) {
      const q = Math.min(maxQuestionsPerBatch, remaining);
      batches.push({
        text: p.text,
        questionCount: q,
        chunkIndices: p.chunkIndices,
      });
      remaining -= q;
    }
  });

  return {
    batches,
    plannedLlmCalls: batches.length,
  };
}