import { CalendarDays, CheckCircle2 } from "lucide-react";
import type { QuizSummary } from "@/lib/api";

interface QuizPickerListProps {
  quizzes: QuizSummary[];
  isLoading: boolean;
  error?: unknown;
  selectedId: string | null;
  onSelect: (quiz: QuizSummary) => void;
  onRetry?: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function QuizPickerList({
  quizzes,
  isLoading,
  error,
  selectedId,
  onSelect,
  onRetry,
}: QuizPickerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 pt-5" aria-label="Loading quizzes">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-[var(--radius-card)] bg-subtle motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mt-5 rounded-[var(--radius-card)] bg-danger-soft px-5 py-6"
      >
        <p className="font-semibold text-ink">We couldn't load your quizzes.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try loading your quizzes again.
        </p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-ink focus-visible:ring-3 focus-visible:ring-primary/30">Try again</button>}
      </div>
    );
  }

  const playable = quizzes.filter((q) => q.questionCount > 0);

  if (playable.length === 0) {
    return (
      <div className="mt-5 rounded-[var(--radius-card)] bg-subtle px-6 py-10 text-center">
        <p className="text-lg font-bold text-ink">No past quizzes yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF or text file to make your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-5">
      {playable.map((quiz) => {
        const isSelected = quiz.id === selectedId;
        return (
          <button
            key={quiz.id}
            type="button"
            onClick={() => onSelect(quiz)}
            aria-pressed={isSelected}
            className={`group flex min-h-20 w-full items-center justify-between gap-4 rounded-[var(--radius-card)] border bg-surface p-4 text-left outline-none transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 motion-reduce:transform-none ${
              isSelected
                ? "border-primary ring-3 ring-primary/20"
                : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{quiz.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{quiz.questionCount} questions</span>
                <span className="flex items-center gap-1.5 text-xs">
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatDate(quiz.createdAt)}
                </span>
              </div>
            </div>
            <CheckCircle2
              aria-hidden="true"
              className={`size-5 shrink-0 transition-colors ${
                isSelected
                  ? "text-primary"
                  : "text-text-muted group-hover:text-muted"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
