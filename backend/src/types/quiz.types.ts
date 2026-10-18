import type { GeneratedQuestionInput } from "../schemas/quiz.js";

export type GeneratedQuestion = GeneratedQuestionInput;

export type QuestionBatch = {
  /** Joined chunk text sent to the LLM as source material */
  text: string;
  /** How many questions this batch should produce */
  questionCount: number;
  /** Original chunk indices included (debug / logging) */
  chunkIndices: number[];
  chunks: Array<{ chunkId: string; text: string }>;
};

export type SourcePack = {
  text: string;
  chunkIndices: number[];
  chunks: Array<{ chunkId: string; text: string }>;
  estimatedInputTokens: number;
};

export type BatchValidationOutcome =
  | "valid"
  | "invalid-json"
  | "schema-invalid"
  | "count-mismatch"
  | "capacity-failure"
  | "provider-error";

export type BatchOutcome = {
  requestedQuestionCount: number;
  generatedQuestionCount: number;
  uniqueQuestionCount: number;
  outputTokens?: number | undefined;
  finishReason?: string | undefined;
  validationOutcome: BatchValidationOutcome;
  healthy: boolean;
  retried: boolean;
};

export type AdaptivePlannerState = {
  requestedTotal: number;
  generatedTotal: number;
  remainingQuestions: number;
  currentBatchSize: number;
  observedTokensPerQuestion: number | null;
  usableOutputBudget: number;
  previousBatchOutcome: BatchOutcome | null;
  successfulBatchCount: number;
  failedBatchCount: number;
  retryCount: number;
  totalLlmCalls: number;
  noProgressCount: number;
};

export type PlannedAdaptiveBatch = {
  questionCount: number;
  sourcePack: SourcePack;
  sourcePackIndex: number;
};

export type GenerationMetrics = {
  resolvedModel: string;
  configuredMaxOutputTokens: number;
  usableOutputBudget: number;
  requestedTotal: number;
  batchSizes: number[];
  outputTokensByBatch: Array<number | undefined>;
  tokensPerQuestionByBatch: Array<number | undefined>;
  finishReasons: Array<string | undefined>;
  validationOutcomes: BatchValidationOutcome[];
  retries: number;
  failedBatches: number;
  successfulBatchCount: number;
  totalLlmCalls: number;
  durationMs: number;
  finalGeneratedCount: number;
};

export type GeminiGenerationConfig = {
  model: string;
  maxOutputTokens: number;
  usableOutputBudget: number;
  apiKey?: string | undefined;
};

export type AdaptiveQuizGenerationInput = {
  chunks: string[];
  requestedCount: number;
  modelConfig: GeminiGenerationConfig;
  runId?: string | undefined;
};

export type AdaptiveQuizGenerationResult = {
  questions: GeneratedQuestion[];
  metrics: GenerationMetrics;
  complete: boolean;
};
