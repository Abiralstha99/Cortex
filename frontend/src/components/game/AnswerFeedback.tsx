import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerResult } from "@/lib/api";
import { cn } from "@/lib/utils";

type AnswerFeedbackProps = {
  result: AnswerResult;
};

export default function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const reduce = useReducedMotion();

  const placementText = result.placement
    ? result.placement === 1
      ? "1st"
      : result.placement === 2
      ? "2nd"
      : result.placement === 3
      ? "3rd"
      : `${result.placement}th`
    : null;

  const content = (
    <>
      <div className="mb-3 flex justify-center">
        {result.correct ? (
          <CheckCircle2 className="size-10 text-success" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <XCircle className="size-10 text-danger" strokeWidth={2.5} aria-hidden="true" />
        )}
      </div>
      <h2 className="mb-2 text-balance font-display text-2xl font-extrabold text-ink">
        {result.correct ? "Correct" : "Not this time"}
      </h2>
      <div className="mb-2 font-mono text-2xl font-semibold tabular-nums text-ink">
        +{result.pointsEarned} points
      </div>
      {placementText && (
        <div className="mb-3 font-mono text-sm font-semibold text-muted">{placementText} place</div>
      )}
      <div className="text-pretty text-ink">
        Correct answer: <strong>{result.correctAnswer}</strong>
      </div>
      <p className="mt-5 text-pretty text-sm font-medium text-muted">
        Waiting for other players...
      </p>
    </>
  );

  const baseClasses = cn(
    "rounded-[var(--radius-sticker)] border-4 border-white p-7 text-center shadow-[0_10px_0_0_rgb(0_0_0/0.12)] ring-2 sm:p-9",
    result.correct ? "bg-success-soft ring-success" : "bg-danger-soft ring-danger",
  );

  if (reduce) {
    return <div className={baseClasses}>{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={baseClasses}
    >
      {content}
    </motion.div>
  );
}
