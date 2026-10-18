import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type {
  GeminiGenerationConfig,
  QuestionBatch,
} from "../../types/quiz.types.js";

/**
 * Single-batch question generation via Google Gemini (Vercel AI SDK).
 */

const SYSTEM_PROMPT = `Generate study questions from the supplied notes. Return ONLY a JSON array, without markdown.
Each element has "question" (at least 10 characters), "type", "content", "explanation", and "sources".
Write an explanation of one or two concise sentences (10–320 characters) that helps someone who answered incorrectly.
For every question include one or more sources as {"chunkId":"chunk-1","quote":"exact text copied from that chunk"}. Use only chunk IDs in the supplied source material. Copy each quote verbatim, including case and punctuation; keep it under 500 characters. Every answer and explanation must be supported by its cited quotes.
Use any mix of these types that best fits the material; do not force a ratio:
- MCQ: {"question":"...","type":"MCQ","content":{"options":["...","...","...","..."],"correctIndex":0},"explanation":"...","sources":[{"chunkId":"chunk-1","quote":"..."}]} (index 0-3)
- True/false: {"question":"...","type":"TRUE_FALSE","content":{"correctAnswer":true},"explanation":"...","sources":[{"chunkId":"chunk-1","quote":"..."}]}
- Fill in the blank: {"question":"...","type":"FILL_BLANK","content":{"acceptedAnswers":["...","..."]},"explanation":"...","sources":[{"chunkId":"chunk-1","quote":"..."}]}
Each answer must be supported by the source. For blanks, include equivalent exact answers only, without vague alternatives. Prefer distinct coverage.`;

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
Generate exactly ${batch.questionCount} questions as a JSON array.`;

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
