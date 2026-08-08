import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import type { QuestionBatch } from "../../types/quiz.types.js";

/**
 * Single-batch question generation via xAI Grok (Vercel AI SDK).
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

const DEFAULT_MODEL = "grok-4.20-non-reasoning";

export type CallLlmForBatchInput = {
  batch: QuestionBatch;
  batchIndex: number;
  totalBatches: number;
  previousError?: string;
};

export type GenerateDeps = {
  complete?: (userPrompt: string) => Promise<string>;
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
 * Prefer deps.complete in tests; otherwise xAI with XAI_API_KEY / XAI_MODEL.
 */
export async function callLlmForBatch(
  input: CallLlmForBatchInput,
  deps: GenerateDeps = {},
): Promise<string> {
  if (deps.complete) {
    return deps.complete(buildUserPrompt(input));
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const xai = createXai({ apiKey });
  const model = process.env.XAI_MODEL ?? DEFAULT_MODEL;

  try {
    const { text } = await generateText({
      model: xai(model),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(input),
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    if (!text) {
      throw new Error("Empty completion from xAI");
    }
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "xAI request failed";
    throw new Error(msg);
  }
}
