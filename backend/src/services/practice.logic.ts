import { QuestionContentSchema } from "../schemas/quiz.js";

type Question = { type: string; content: unknown };
export type PracticeAnswer = { selectedIndex: number } | { answer: boolean } | { answer: string };

export function validatePracticeAnswer(question: Question, input: unknown): PracticeAnswer | null {
  const parsed = QuestionContentSchema.safeParse(question);
  if (!parsed.success || !input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (parsed.data.type === "MCQ") {
    return Object.keys(value).length === 1 && Number.isInteger(value.selectedIndex) &&
      (value.selectedIndex as number) >= 0 && (value.selectedIndex as number) < parsed.data.content.options.length
      ? { selectedIndex: value.selectedIndex as number } : null;
  }
  if (parsed.data.type === "TRUE_FALSE") {
    return Object.keys(value).length === 1 && typeof value.answer === "boolean" ? { answer: value.answer } : null;
  }
  return Object.keys(value).length === 1 && typeof value.answer === "string" && value.answer.trim().length > 0
    ? { answer: value.answer } : null;
}

export function gradePracticeAnswer(question: Question, input: unknown): boolean {
  const parsed = QuestionContentSchema.parse(question);
  const answer = validatePracticeAnswer(question, input);
  if (!answer) return false;
  if (parsed.type === "MCQ") return "selectedIndex" in answer && answer.selectedIndex === parsed.content.correctIndex;
  if (parsed.type === "TRUE_FALSE") return "answer" in answer && answer.answer === parsed.content.correctAnswer;
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, "");
  return "answer" in answer && typeof answer.answer === "string" &&
    parsed.content.acceptedAnswers.some((accepted) => normalize(accepted) === normalize(answer.answer as string));
}

export function resumePosition(order: string[], answered: string[]): number {
  const saved = new Set(answered);
  return order.findIndex((id) => !saved.has(id));
}

export function publicPracticeQuestion(question: { id: string; question: string; type: string; content: unknown }) {
  const parsed = QuestionContentSchema.parse({ type: question.type, content: question.content });
  return parsed.type === "MCQ"
    ? { id: question.id, question: question.question, type: parsed.type, options: parsed.content.options }
    : { id: question.id, question: question.question, type: parsed.type };
}
