import { ChevronRight } from "lucide-react";
import type { QuizSummary } from "@/lib/api";

interface QuizPickerListProps {
  quizzes: QuizSummary[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (quiz: QuizSummary) => void;
}

export default function QuizPickerList({
  quizzes,
  isLoading,
  selectedId,
  onSelect,
}: QuizPickerListProps) {
  const playable = quizzes.filter((q) => q.questionCount > 0);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
        <p className="text-sm text-muted">Loading quizzes…</p>
      </div>
    );
  }

  if (playable.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-medium text-ink">No past quizzes available</p>
        <p className="mt-1 text-sm text-muted">
          Upload a PDF to generate your first quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-4">
      {playable.map((quiz) => {
        const isSelected = quiz.id === selectedId;
        return (
          <button
            key={quiz.id}
            type="button"
            onClick={() => onSelect(quiz)}
            className={`flex w-full items-center justify-between rounded-lg border bg-surface p-4 text-left transition-colors hover:border-rose ${
              isSelected ? "border-rose ring-2 ring-rose" : "border-border"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{quiz.title}</p>
              <p className="mt-0.5 text-sm text-muted">
                <span className="font-mono">{quiz.questionCount}</span>{" "}
                questions
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted" />
          </button>
        );
      })}
    </div>
  );
}
