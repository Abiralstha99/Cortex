import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type {
  GeminiGenerationConfig,
  QuestionBatch,
} from "../../types/quiz.types.js";

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

export type CallLlmForBatchInput = {
  batch: QuestionBatch;
  batchIndex: number;
  previousError?: string;
};

export type GenerateDeps = {
  complete?: (
    userPrompt: string,
    config: GeminiGenerationConfig,
  ) => Promise<string | LlmBatchResponse>;
};

/** Dependency contract for deterministic adaptive response-metadata tests. */
export type AdaptiveGenerateDeps = GenerateDeps;

export type LlmBatchResponse = {
  text: string;
  finishReason?: string | undefined;
  outputTokens?: number | undefined;
};

function buildUserPrompt(input: CallLlmForBatchInput): string {
  const { batch, batchIndex, previousError } = input;
  const batchLabel = `adaptive batch ${batchIndex + 1}`;
  let prompt = `Source material (${batchLabel}):
${batch.text}
Generate exactly ${batch.questionCount} multiple-choice questions as a JSON array.`;

  if (previousError) {
    prompt += `\n\nYour previous response failed validation with this error: ${previousError}. Fix it and return valid JSON.`;
  }
  return prompt;
}

/**
 * One raw LLM call for a single batch (not validated).
 * Prefer deps.complete in tests; otherwise use the startup-resolved Gemini config.
 */
export async function callLlmForBatch(
  input: CallLlmForBatchInput,
  config: GeminiGenerationConfig,
  deps: GenerateDeps = {},
): Promise<LlmBatchResponse> {
  if (deps.complete) {
    const completion = await deps.complete(buildUserPrompt(input), config);
    return typeof completion === "string" ? { text: completion } : completion;
  }

  if (!config.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const google = createGoogleGenerativeAI({ apiKey: config.apiKey });

  try {
    const { text, finishReason, usage } = await generateText({
      model: google(config.model),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(input),
      temperature: 0.3,
      maxOutputTokens: config.maxOutputTokens,
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
