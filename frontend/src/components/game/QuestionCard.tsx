import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type QuestionCardProps = {
  question: string;
  options: string[];
  onSubmit: (index: number) => void;
  disabled: boolean;
  selectedIndex: number | null;
};

const LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  options,
  onSubmit,
  disabled,
  selectedIndex,
}: QuestionCardProps) {
  const reduce = useReducedMotion();

  return (
    <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-4 shadow-card sm:p-5">
      <h1 className="mb-5 max-w-3xl text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">
        {question}
      </h1>
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
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
              className={cn(
                "flex min-h-14 w-full items-center rounded-[var(--radius-control)] border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 sm:min-h-16 sm:px-4",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isSelected
                  ? "border-primary bg-primary-soft ring-1 ring-primary"
                  : "border-border bg-subtle hover:border-primary/60 hover:bg-surface-hover",
                disabled
                  ? "cursor-not-allowed opacity-75"
                  : "cursor-pointer",
              )}
              onClick={() => onSubmit(index)}
              disabled={disabled}
              {...motionProps}
            >
              <span
                className={cn(
                  "mr-3 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border font-mono text-sm font-semibold sm:mr-3.5",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {LETTERS[index]}
              </span>
              <span className="min-w-0 text-pretty font-display text-base font-semibold leading-snug text-ink sm:text-[1.0625rem]">
                {option}
              </span>
            </ButtonTag>
          );
        })}
      </div>
      {disabled && selectedIndex !== null && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 text-center text-sm font-semibold text-primary"
        >
          Answer submitted
        </p>
      )}
    </section>
  );
}
