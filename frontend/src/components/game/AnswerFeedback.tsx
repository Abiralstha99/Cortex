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
      <h1 className="mb-2 text-balance font-display text-3xl font-bold text-ink">
        {result.correct ? "Correct!" : "Not quite"}
      </h1>
      <div className="mb-2 font-mono text-2xl font-semibold tabular-nums text-ink">
        +{result.pointsEarned} pts
      </div>
      {placementText && (
        <div className="mb-3 font-mono text-sm font-semibold text-muted-foreground">{placementText} place</div>
      )}
      <p className="mt-5 text-pretty text-sm font-medium text-muted-foreground">
        Waiting for other players...
      </p>
    </>
  );

  const baseClasses = cn(
    "editorial-stage rounded-[var(--radius-panel)] border p-7 text-center shadow-card sm:p-9",
    result.correct
      ? "border-success/30 bg-success-soft"
      : "border-danger/30 bg-danger-soft",
  );

  if (reduce) {
    return (
      <section role="status" aria-live="polite" className={baseClasses}>
        {content}
      </section>
    );
  }

  return (
    <motion.section
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className={baseClasses}
    >
      {content}
    </motion.section>
  );
}
