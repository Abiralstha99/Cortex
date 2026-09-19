/** Runtime configuration for adaptive Gemini generation. */

import type { GeminiGenerationConfig } from "../../types/quiz.types.js";

export const DEFAULT_LOCAL_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
export const USABLE_OUTPUT_BUDGET_RATIO = 0.8;

export type ModelGenerationConfig = GeminiGenerationConfig;

// Resolve the model configuration from the environment variables.
export function resolveModelGenerationConfig(
  env: NodeJS.ProcessEnv = process.env,
): ModelGenerationConfig {
  const model = resolveModel(env);
  const maxOutputTokens = resolveMaxOutputTokens(env);
  const usableOutputBudget = maxOutputTokens * USABLE_OUTPUT_BUDGET_RATIO;
  const apiKey = env.GEMINI_API_KEY?.trim() || undefined;

  if (env.NODE_ENV === "production" && !apiKey) {
    throw new Error("GEMINI_API_KEY is required in production");
  }

  return { model, maxOutputTokens, usableOutputBudget, apiKey };
}

function resolveModel(env: NodeJS.ProcessEnv): string {
  const configuredModel = env.GEMINI_MODEL?.trim();
  if (configuredModel) return configuredModel;
  if (env.NODE_ENV === "production") {
    throw new Error("GEMINI_MODEL is required in production");
  }
  return DEFAULT_LOCAL_GEMINI_MODEL;
}

function resolveMaxOutputTokens(env: NodeJS.ProcessEnv): number {
  const raw = env.GEMINI_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw === "") {
    return DEFAULT_MAX_OUTPUT_TOKENS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid GEMINI_MAX_OUTPUT_TOKENS output cap: ${JSON.stringify(raw)}`,
    );
  }

  return parsed;
}

export function logModelGenerationConfig(
  config: ModelGenerationConfig,
): void {
  console.info("[quiz-gen] model-config:startup", {
    model: config.model,
    maxOutputTokens: config.maxOutputTokens,
    usableOutputBudget: config.usableOutputBudget,
  });
}
