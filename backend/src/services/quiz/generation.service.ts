import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { QuestionBatch } from "../../types/quiz.types.js";

/**
 * Single-batch question generation via Google Gemini (Vercel AI SDK).
 */

const SYSTEM_PROMPT = `You generate multiple-choice study questions from source notes.
Return ONLY a JSON array. No markdown, no explanation, no code fences.
Each element must match exactly:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0 | 1 | 2 | 3,
  "explanation": "string"
}
Rules:
- Exactly 4 options; one correct answer at correctIndex.
- Questions must be answerable from the provided source text only.
- Prefer distinct coverage of the material.`;

const DEFAULT_MODEL = "gemini-3.5-flash";
const DEFAULT_OUTPUT_TOKEN_CAP = 8192;

function getResolvedModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

function getResolvedOutputTokenCap(): number {
  return parseInt(
    process.env.GEMINI_MAX_OUTPUT_TOKENS ?? String(DEFAULT_OUTPUT_TOKEN_CAP),
    10,
  );
}

export function logGenerationConfig(): void {
  console.info("[quiz-gen] generation:config", {
    resolvedModel: getResolvedModel(),
    outputTokenCap: getResolvedOutputTokenCap(),
  });
}

export type CallLlmForBatchInput = {
  batch: QuestionBatch;
  batchIndex: number;
  totalBatches: number;
  previousError?: string;
};

export type GenerateDeps = {
  complete?: (userPrompt: string) => Promise<string>;
};

export type LlmBatchResponse = {
  text: string;
  finishReason?: string | undefined;
  outputTokens?: number | undefined;
};

function buildUserPrompt(input: CallLlmForBatchInput): string {
  const { batch, batchIndex, totalBatches, previousError } = input;
  let prompt = `Source material (batch ${batchIndex + 1} of ${totalBatches}):
${batch.text}
Generate exactly ${batch.questionCount} multiple-choice questions as a JSON array.`;

  if (previousError) {
    prompt += `\n\nYour previous response failed validation with this error: ${previousError}. Fix it and return valid JSON.`;
  }
  return prompt;
}

/**
 * One raw LLM call for a single batch (not validated).
 * Prefer deps.complete in tests; otherwise Gemini with GEMINI_API_KEY / GEMINI_MODEL.
 */
export async function callLlmForBatch(
  input: CallLlmForBatchInput,
  deps: GenerateDeps = {},
): Promise<LlmBatchResponse> {
  if (deps.complete) {
    return { text: await deps.complete(buildUserPrompt(input)) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const model = getResolvedModel();

  try {
    const { text, finishReason, usage } = await generateText({
      model: google(model),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(input),
      temperature: 0.3,
      maxOutputTokens: getResolvedOutputTokenCap(),
    });

    if (!text) {
      throw new Error("Empty completion from Gemini");
    }
    return {
      text,
      finishReason,
      outputTokens: usage.outputTokens,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini request failed";
    throw new Error(msg);
  }
}
