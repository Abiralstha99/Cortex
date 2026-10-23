import { useState } from "react";
import type { AnswerResult, AnswerValue, NewQuestionPayload } from "@/lib/api";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type QuestionCardProps = {
  question: string;
  options?: string[];
  type: NewQuestionPayload["type"];
  onSubmit: (answer: AnswerValue) => void;
  disabled: boolean;
  selectedAnswer: AnswerValue | null;
  answerResult?: AnswerResult | null;
};

const LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  options = [],
  type,
  onSubmit,
  disabled,
  selectedAnswer,
  answerResult,
}: QuestionCardProps) {
  const reduce = useReducedMotion();
  const [blankAnswer, setBlankAnswer] = useState(typeof selectedAnswer === "string" ? selectedAnswer : "");

  return (
    <motion.section
      className="editorial-question rounded-[var(--radius-panel)] border border-border bg-surface p-4 shadow-card sm:p-5"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 tabIndex={-1} className="mb-5 max-w-3xl text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">
        {question}
      </h1>
      {type === "FILL_BLANK" ? (
        <form onSubmit={(event) => { event.preventDefault(); if (blankAnswer.trim()) onSubmit(blankAnswer); }} className="space-y-3">
          <label htmlFor="blank-answer" className="block text-sm font-semibold text-ink">Your answer</label>
          <input id="blank-answer" name="answer" type="text" maxLength={500} autoComplete="off"
            value={blankAnswer} onChange={(event) => setBlankAnswer(event.target.value)} disabled={disabled}
            className={cn("min-h-14 w-full rounded-[var(--radius-control)] border bg-subtle px-4 text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40", answerResult ? (answerResult.correct ? "border-success" : "border-danger") : "border-border")} />
          <button type="submit" disabled={disabled || !blankAnswer.trim()}
            className="min-h-14 rounded-[var(--radius-control)] bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40">Submit answer</button>
        </form>
      ) : (
      <div className="editorial-question-options space-y-2.5">
        {(type === "TRUE_FALSE" ? ["True", "False"] : options).map((option, index) => {
          const answer = type === "TRUE_FALSE" ? index === 0 : index;
          const isSelected = selectedAnswer === answer;
          const isCorrect = answerResult?.correctAnswer === answer;
          const isWrong = !!answerResult && isSelected && !isCorrect;
          const ButtonTag = reduce ? "button" : motion.button;
          const motionProps = reduce
            ? {}
            : {
                whileTap: { scale: 0.97 },
                transition: { type: "spring" as const, stiffness: 500, damping: 32 },
              };

          return (
            <ButtonTag
              key={index}
              type="button"
              aria-pressed={isSelected}
              data-feedback={isCorrect ? "correct" : isWrong ? "incorrect" : undefined}
              className={cn(
                "editorial-answer flex min-h-14 w-full items-center rounded-[var(--radius-control)] border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 sm:min-h-16 sm:px-4",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isCorrect
                  ? "border-success bg-success/10"
                  : isWrong
                    ? "border-danger bg-danger/10"
                : isSelected
                  ? "border-primary bg-primary-soft ring-1 ring-primary"
                  : "border-border bg-subtle hover:border-primary/60 hover:bg-surface-hover",
                disabled
                  ? "cursor-not-allowed opacity-75"
                  : "cursor-pointer",
              )}
              onClick={() => onSubmit(answer)}
              disabled={disabled}
              {...motionProps}
            >
              <span
                className={cn(
                  "mr-3 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border font-mono text-sm font-semibold sm:mr-3.5",
                  isCorrect
                    ? "border-success bg-success text-white"
                    : isWrong
                      ? "border-danger bg-danger text-white"
                  : isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {type === "TRUE_FALSE" ? (index === 0 ? "T" : "F") : LETTERS[index]}
              </span>
              <span className="min-w-0 text-pretty font-display text-base font-semibold leading-snug text-ink sm:text-[1.0625rem]">
                {option}
              </span>
              {isCorrect && <span className="ml-auto text-sm font-semibold text-success-foreground">✓ Correct</span>}
              {isWrong && <span className="ml-auto text-sm font-semibold text-danger-foreground">✕ Incorrect</span>}
            </ButtonTag>
          );
        })}
      </div>
      )}
      {disabled && selectedAnswer !== null && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 text-center text-sm font-semibold text-primary"
        >
          {answerResult
            ? `${answerResult.correct ? "✓ Correct" : "✕ Incorrect"} · +${answerResult.pointsEarned} pts. Waiting for other players…`
            : "Checking your answer…"}
        </p>
      )}
      {type === "FILL_BLANK" && answerResult && (
        <p className="mt-3 text-sm font-semibold text-ink">Accepted answer: {String(answerResult.correctAnswer)}</p>
      )}
    </motion.section>
  );
}
