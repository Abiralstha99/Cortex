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
    <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-[0_8px_0_0_rgb(31_107_74/0.10)] sm:p-7">
      <h1 className="mb-7 max-w-2xl text-balance font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
        {question}
      </h1>
      <div className="grid gap-3">
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
                "flex min-h-16 w-full items-center rounded-full border-2 px-4 py-3 text-left transition-[background-color,border-color,box-shadow] duration-150",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30",
                isSelected
                  ? "border-candy-pink bg-candy-pink/35 ring-4 ring-forest"
                  : "border-border bg-background hover:border-candy-pink hover:bg-candy-pink/10",
                disabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer",
              )}
              onClick={() => onSubmit(index)}
              disabled={disabled}
              {...motionProps}
            >
              <span
                className={cn(
                  "mr-3 flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold",
                  isSelected ? "bg-forest text-primary-foreground" : "bg-track text-muted",
                )}
              >
                {LETTERS[index]}
              </span>
              <span className="text-pretty font-display text-base font-bold text-ink sm:text-lg">
                {option}
              </span>
            </ButtonTag>
          );
        })}
      </div>
    </section>
  );
}
