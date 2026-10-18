import * as z from "zod";

// Accept any positive int; pipeline caps at MAX_QUESTIONS (50).
// Clients may send 100; response count is still ≤ 50.
export const GenerateCountSchema = z.coerce.number().int().min(1);

/** Optional display name; empty/missing falls back to the uploaded filename. */
export const QuizTitleSchema = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const QuizIdParamsSchema = z.object({
  quizId: z.string().uuid(),
});

/** Redis async generation job id (not a Postgres quiz id). */
export const JobIdParamsSchema = z.object({
  jobId: z.string().uuid(),
});

const questionBase = {
  question: z.string().trim().min(10),
  explanation: z.string().trim().min(10).max(320),
  sources: z.array(z.object({
    chunkId: z.string().regex(/^chunk-[1-9]\d*$/),
    quote: z.string().min(1).max(500),
  }).strict()).min(1),
};
const nonemptyAnswer = z.string().trim().min(1);

export const QuestionContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("MCQ"), content: z.object({
    options: z.tuple([nonemptyAnswer, nonemptyAnswer, nonemptyAnswer, nonemptyAnswer]),
    correctIndex: z.number().int().min(0).max(3),
  }).strict() }),
  z.object({ type: z.literal("TRUE_FALSE"), content: z.object({
    correctAnswer: z.boolean(),
  }).strict() }),
  z.object({ type: z.literal("FILL_BLANK"), content: z.object({
    acceptedAnswers: z.array(nonemptyAnswer).min(1),
  }).strict() }),
]);

export const GeneratedQuestionSchema = z.discriminatedUnion("type", [
  z.object({ ...questionBase, type: z.literal("MCQ"), content: z.object({
    options: z.tuple([nonemptyAnswer, nonemptyAnswer, nonemptyAnswer, nonemptyAnswer]),
    correctIndex: z.number().int().min(0).max(3),
  }).strict() }),
  z.object({ ...questionBase, type: z.literal("TRUE_FALSE"), content: z.object({
    correctAnswer: z.boolean(),
  }).strict() }),
  z.object({ ...questionBase, type: z.literal("FILL_BLANK"), content: z.object({
    acceptedAnswers: z.array(nonemptyAnswer).min(1),
  }).strict() }),
]);

export const GeneratedQuestionsArraySchema = z
  .array(GeneratedQuestionSchema)
  .min(1);

export type GenerateCount = z.infer<typeof GenerateCountSchema>;
export type QuizTitle = z.infer<typeof QuizTitleSchema>;
export type QuizIdParams = z.infer<typeof QuizIdParamsSchema>;
export type JobIdParams = z.infer<typeof JobIdParamsSchema>;
export type GeneratedQuestionInput = z.infer<typeof GeneratedQuestionSchema>;
