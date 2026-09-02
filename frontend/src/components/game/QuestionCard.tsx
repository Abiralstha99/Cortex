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
    <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-card sm:p-7">
      <h1 className="mb-7 max-w-3xl text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
        {question}
      </h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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
                "flex min-h-14 w-full items-center rounded-[var(--radius-control)] border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 md:min-h-22 md:px-5",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
                isSelected
                  ? "border-primary bg-primary-soft ring-2 ring-primary"
                  : "border-border bg-subtle hover:border-primary/50 hover:bg-primary-soft",
                disabled
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer",
              )}
              onClick={() => onSubmit(index)}
              disabled={disabled}
              {...motionProps}
            >
              <span
                className={cn(
                  "mr-3 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] font-mono text-sm font-semibold",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground",
                )}
              >
                {LETTERS[index]}
              </span>
              <span className="text-pretty font-display text-base font-semibold text-ink sm:text-lg">
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
