export type GeneratedQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type QuestionBatch = {
  /** Joined chunk text sent to the LLM as source material */
  text: string;
  /** How many questions this batch should produce */
  questionCount: number;
  /** Original chunk indices included (debug / logging) */
  chunkIndices: number[];
};

export type PipelinePrepareResult = {
  title: string;
  sourceType: "pdf" | "text";
  batches: QuestionBatch[];
  plannedLlmCalls: number;
  requestedCount: number;
};

export type GenerateAllBatchesResult = {
  questions: GeneratedQuestion[];
  generatedCount: number;
  failedBatches: number;
};
