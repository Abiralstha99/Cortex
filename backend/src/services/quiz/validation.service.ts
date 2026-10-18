import type { GeneratedQuestion } from "../../types/quiz.types.js";
import { GeneratedQuestionsArraySchema } from "../../schemas/quiz.js";

// Removes code fences from the raw text
function stripFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return s.trim();
}

export function parseAndValidateQuestions(
  raw: string,
  sourceChunks?: Array<{ chunkId: string; text: string }>,
): GeneratedQuestion[] {
  const stripped = stripFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error("Response was not valid JSON");
  }

  try {
    const result = GeneratedQuestionsArraySchema.parse(parsed);
    if (sourceChunks) {
      const chunksById = new Map(sourceChunks.map((chunk) => [chunk.chunkId, chunk.text]));
      for (const question of result) {
        for (const source of question.sources) {
          const chunk = chunksById.get(source.chunkId);
          if (!chunk || !chunk.includes(source.quote)) {
            throw new Error(`Invalid source reference ${source.chunkId}: quote must appear verbatim in its source chunk`);
          }
        }
      }
    }
    return result;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Question validation failed";
    throw new Error(`Question validation failed: ${message}`);
  }
}

function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      else dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

// Removes duplicate questions based on Levenshtein distance
export function dedupeQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  const accepted: GeneratedQuestion[] = [];
  for (const q of questions) {
    const nq = normalizeQuestion(q.question);
    const isDup = accepted.some((a) => {
      const na = normalizeQuestion(a.question);
      const maxLen = Math.max(na.length, nq.length, 1);
      return lcsLength(na, nq) / maxLen > 0.8;
    });
    if (!isDup) accepted.push(q);
  }
  return accepted;
}
