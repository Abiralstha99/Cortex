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

export const GeneratedQuestionSchema = z.object({
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

export const GeneratedQuestionsArraySchema = z
  .array(GeneratedQuestionSchema)
  .min(1);

export type GenerateCount = z.infer<typeof GenerateCountSchema>;
export type QuizTitle = z.infer<typeof QuizTitleSchema>;
export type QuizIdParams = z.infer<typeof QuizIdParamsSchema>;
export type JobIdParams = z.infer<typeof JobIdParamsSchema>;
export type GeneratedQuestionInput = z.infer<typeof GeneratedQuestionSchema>;
