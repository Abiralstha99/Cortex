import * as z from "zod";
import type { GeneratedQuestion } from "../../types/quiz.types.js";
import { ValidationError } from "./errors.js";

const QuestionSchema = z.object({
  question: z.string().min(10),
  options: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  correctIndex: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),
  explanation: z.string().min(10),
});

const QuestionsArraySchema = z.array(QuestionSchema).min(1);

// Removes code fences from the raw text
function stripFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return s.trim();
}

export function parseAndValidateQuestions(raw: string): GeneratedQuestion[] {
  const stripped = stripFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new ValidationError("Response was not valid JSON");
  }
  const result = QuestionsArraySchema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => i.message).join("; "),
    );
  }
  return result.data.map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
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