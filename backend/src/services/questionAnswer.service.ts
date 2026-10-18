import type { z } from "zod";
import { QuestionContentSchema } from "../schemas/quiz.js";

export type QuestionContent = z.infer<typeof QuestionContentSchema>;
export type AnswerValue = number | boolean | string;

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function isAnswerValueForQuestion(question: QuestionContent, answer: AnswerValue): boolean {
  return question.type === "MCQ" ? typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer <= 3
    : question.type === "TRUE_FALSE" ? typeof answer === "boolean" : typeof answer === "string" && answer.trim().length > 0;
}

export function gradeAnswer(question: QuestionContent, answer: AnswerValue): boolean {
  switch (question.type) {
    case "MCQ": return typeof answer === "number" && answer === question.content.correctIndex;
    case "TRUE_FALSE": return typeof answer === "boolean" && answer === question.content.correctAnswer;
    case "FILL_BLANK": return typeof answer === "string" &&
      question.content.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalizeAnswer(answer));
  }
}

export function correctAnswerLabel(question: QuestionContent): string {
  switch (question.type) {
    case "MCQ": return question.content.options[question.content.correctIndex] ?? "";
    case "TRUE_FALSE": return question.content.correctAnswer ? "True" : "False";
    case "FILL_BLANK": return question.content.acceptedAnswers.join(" / ");
  }
}

export function publicQuestionContent(question: QuestionContent) {
  return question.type === "MCQ"
    ? { type: question.type, options: question.content.options }
    : { type: question.type };
}
