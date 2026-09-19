import type {
  AdaptivePlannerState,
  BatchOutcome,
  PlannedAdaptiveBatch,
  SourcePack,
} from "../../types/quiz.types.js";

/** Sequential adaptive planner for the future generation pipeline. */

export const DEFAULT_INITIAL_BATCH_SIZE = 4;
export const DEFAULT_MAX_QUESTIONS_PER_BATCH = 8;
export const DEFAULT_MAX_NO_PROGRESS_BATCHES = 3;

export type CreateAdaptivePlannerInput = {
  sourcePacks: SourcePack[];
  requestedTotal: number;
  usableOutputBudget: number;
  initialBatchSize?: number | undefined;
  maxQuestionsPerBatch?: number | undefined;
  maxNoProgressBatches?: number | undefined;
};

export type AdaptivePlanner = {
  getState(): AdaptivePlannerState;
  hasRemainingQuestions(): boolean;
  nextBatch(): PlannedAdaptiveBatch;
  recordOutcome(outcome: BatchOutcome): void;
};

export function createAdaptivePlanner(
  input: CreateAdaptivePlannerInput,
): AdaptivePlanner {
  const sourcePacks = input.sourcePacks;
  if (sourcePacks.length === 0) {
    throw new Error("Adaptive planner requires at least one source pack");
  }

  const requestedTotal = positiveInteger(input.requestedTotal, "requestedTotal");
  const usableOutputBudget = positiveNumber(
    input.usableOutputBudget,
    "usableOutputBudget",
  );
  const maxQuestionsPerBatch = positiveInteger(
    input.maxQuestionsPerBatch ?? DEFAULT_MAX_QUESTIONS_PER_BATCH,
    "maxQuestionsPerBatch",
  );
  const initialBatchSize = Math.min(
    requestedTotal,
    maxQuestionsPerBatch,
    positiveInteger(
      input.initialBatchSize ?? DEFAULT_INITIAL_BATCH_SIZE,
      "initialBatchSize",
    ),
  );
  const maxNoProgressBatches = positiveInteger(
    input.maxNoProgressBatches ?? DEFAULT_MAX_NO_PROGRESS_BATCHES,
    "maxNoProgressBatches",
  );

  let sourcePackCursor = 0;
  const state: AdaptivePlannerState = {
    requestedTotal,
    generatedTotal: 0,
    remainingQuestions: requestedTotal,
    currentBatchSize: initialBatchSize,
    observedTokensPerQuestion: null,
    usableOutputBudget,
    previousBatchOutcome: null,
    successfulBatchCount: 0,
    failedBatchCount: 0,
    retryCount: 0,
    totalLlmCalls: 0,
    noProgressCount: 0,
  };

  return {
    getState: () => ({
      ...state,
      previousBatchOutcome:
        state.previousBatchOutcome === null
          ? null
          : { ...state.previousBatchOutcome },
    }),

    hasRemainingQuestions: () => state.remainingQuestions > 0,

    nextBatch: () => {
      if (state.remainingQuestions === 0) {
        throw new Error("Adaptive planner has no remaining questions");
      }

      const sourcePackIndex = sourcePackCursor;
      sourcePackCursor = (sourcePackCursor + 1) % sourcePacks.length;
      return {
        questionCount: Math.min(state.currentBatchSize, state.remainingQuestions),
        sourcePack: sourcePacks[sourcePackIndex]!,
        sourcePackIndex,
      };
    },

    recordOutcome: (outcome) => {
      state.previousBatchOutcome = { ...outcome };
      state.totalLlmCalls++;
      if (outcome.retried) state.retryCount++;

      if (isHealthyCompletedBatch(outcome)) {
        state.successfulBatchCount++;
        const uniqueQuestionCount = Math.max(
          0,
          Math.min(outcome.uniqueQuestionCount, state.remainingQuestions),
        );
        state.generatedTotal += uniqueQuestionCount;
        state.remainingQuestions -= uniqueQuestionCount;

        if (uniqueQuestionCount > 0) {
          state.noProgressCount = 0;
        } else {
          state.noProgressCount++;
        }

        updateOutputEstimate(state, outcome, maxQuestionsPerBatch);
      } else {
        state.failedBatchCount++;
        state.noProgressCount++;

        if (isCapacityFailure(outcome)) {
          state.currentBatchSize = reduceBatchSize(
            state.currentBatchSize,
            outcome.requestedQuestionCount,
          );
        }
      }

      if (state.noProgressCount >= maxNoProgressBatches) {
        throw new Error(
          `Adaptive planner made no progress for ${state.noProgressCount} consecutive batches`,
        );
      }
    },
  };
}

function isHealthyCompletedBatch(outcome: BatchOutcome): boolean {
  return (
    outcome.healthy &&
    outcome.validationOutcome === "valid" &&
    outcome.finishReason !== "length" &&
    outcome.requestedQuestionCount > 0 &&
    outcome.generatedQuestionCount === outcome.requestedQuestionCount
  );
}

function isCapacityFailure(outcome: BatchOutcome): boolean {
  return (
    outcome.finishReason === "length" ||
    outcome.validationOutcome === "capacity-failure"
  );
}

function updateOutputEstimate(
  state: AdaptivePlannerState,
  outcome: BatchOutcome,
  maxQuestionsPerBatch: number,
): void {
  if (
    outcome.outputTokens === undefined ||
    !Number.isFinite(outcome.outputTokens) ||
    outcome.outputTokens <= 0
  ) {
    return;
  }

  const tokensPerQuestion = outcome.outputTokens / outcome.generatedQuestionCount;
  state.observedTokensPerQuestion = tokensPerQuestion;

  const safeBatchSize = Math.max(
    1,
    Math.min(
      maxQuestionsPerBatch,
      Math.floor(state.usableOutputBudget / tokensPerQuestion),
    ),
  );
  if (safeBatchSize > state.currentBatchSize) {
    state.currentBatchSize++;
  } else if (safeBatchSize < state.currentBatchSize) {
    state.currentBatchSize--;
  }
}

function reduceBatchSize(currentBatchSize: number, attemptedBatchSize: number): number {
  return Math.max(
    1,
    Math.min(currentBatchSize - 1, Math.floor(attemptedBatchSize / 2)),
  );
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function positiveNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}
