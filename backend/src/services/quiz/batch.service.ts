import type { QuestionBatch } from "../../types/quiz.types.js";
import { estimateTokens } from "./tokens.js";

export const DEFAULT_BATCH_TOKEN_BUDGET = 3000;
export const DEFAULT_MAX_QUESTIONS_PER_BATCH = 8;

export type PlanBatchesOptions = {
  tokenBudget?: number;
  maxQuestionsPerBatch?: number;
};

type PackedBatch = {
  text: string;
  chunkIndices: number[];
  tokens: number;
};

/**
 * Pack source chunks by token budget, then allocate `requestedCount`
 * questions across packs. Oversized question slots split into multiple
 * LLM calls with the same text body (bounded by maxQuestionsPerBatch).
 *
 * `plannedLlmCalls` is always `batches.length` — the sync/async gate uses that only.
 */
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
  const packed = packChunksByTokenBudget(chunks, tokenBudget);
  const questionCounts = allocateQuestionCounts(
    packed.map((p) => p.tokens),
    count,
  );

  const batches: QuestionBatch[] = [];
  for (let i = 0; i < packed.length; i++) {
    const pack = packed[i]!;
    let remaining = questionCounts[i]!;
    while (remaining > 0) {
      const questionCount = Math.min(maxQuestionsPerBatch, remaining);
      batches.push({
        text: pack.text,
        questionCount,
        chunkIndices: pack.chunkIndices,
      });
      remaining -= questionCount;
    }
  }

  return {
    batches,
    plannedLlmCalls: batches.length,
  };
}

function packChunksByTokenBudget(
  chunks: string[],
  tokenBudget: number,
): PackedBatch[] {
  const packed: PackedBatch[] = [];
  let current: PackedBatch | null = null;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]!;
    const tokens = estimateTokens(chunk);

    if (!current) {
      current = { text: chunk, chunkIndices: [index], tokens };
      continue;
    }

    if (current.tokens + tokens > tokenBudget) {
      packed.push(current);
      current = { text: chunk, chunkIndices: [index], tokens };
      continue;
    }

    current.text = `${current.text}\n\n---\n\n${chunk}`;
    current.chunkIndices.push(index);
    current.tokens += tokens;
  }

  if (current) packed.push(current);
  return packed;
}

/** Proportionally distribute `count` questions; each pack gets at least 1 when count allows. */
function allocateQuestionCounts(tokenWeights: number[], count: number): number[] {
  const lengths = tokenWeights.map((t) => Math.max(1, t));
  const totalLen = lengths.reduce((a, b) => a + b, 0);

  const rawCounts = lengths.map((tokens) =>
    Math.max(1, Math.round((tokens / totalLen) * count)),
  );

  let sum = rawCounts.reduce((a, b) => a + b, 0);
  while (sum > count) {
    const i = rawCounts.indexOf(Math.max(...rawCounts));
    if (rawCounts[i]! > 1) {
      rawCounts[i]!--;
      sum--;
    } else {
      break;
    }
  }
  while (sum < count) {
    const i = lengths.indexOf(Math.max(...lengths));
    rawCounts[i]!++;
    sum++;
  }

  return rawCounts;
}
