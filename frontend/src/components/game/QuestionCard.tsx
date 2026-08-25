import { motion, useReducedMotion } from "motion/react";

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
    <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-ink mb-6">{question}</h2>
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const ButtonTag = reduce ? "button" : motion.button;
          const motionProps = reduce
            ? {}
            : { whileTap: { scale: 0.98 }, transition: { duration: 0.1 } };

          return (
            <ButtonTag
              key={index}
              type="button"
              aria-pressed={isSelected}
              className={`flex w-full items-center rounded-[var(--radius-control)] border p-4 text-left transition-colors ${
                isSelected
                  ? "border-rose bg-rose/5"
                  : "border-border bg-surface hover:border-muted"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => onSubmit(index)}
              disabled={disabled}
              {...motionProps}
            >
              <span className="font-mono font-bold mr-3 text-muted">
                {LETTERS[index]}
              </span>
              <span className="text-ink">{option}</span>
            </ButtonTag>
          );
        })}
      </div>
    </div>
  );
}
