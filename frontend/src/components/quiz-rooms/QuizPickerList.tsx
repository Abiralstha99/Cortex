import { useMemo, useState } from "react";
import { ChevronRight, Search, CalendarDays } from "lucide-react";
import type { QuizSummary } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizPickerListProps {
  quizzes: QuizSummary[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (quiz: QuizSummary) => void;
}

type DateFilter = "all" | "today" | "week" | "month";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isWithinDateRange(dateStr: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (filter) {
    case "today":
      return diffDays < 1;
    case "week":
      return diffDays < 7;
    case "month":
      return diffDays < 30;
    default:
      return true;
  }
}

export default function QuizPickerList({
  quizzes,
  isLoading,
  selectedId,
  onSelect,
}: QuizPickerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const filteredQuizzes = useMemo(() => {
    const playable = quizzes.filter((q) => q.questionCount > 0);
    const query = searchQuery.trim().toLowerCase();

    return playable.filter((quiz) => {
      const matchesSearch =
        query === "" || quiz.title.toLowerCase().includes(query);
      const matchesDate = isWithinDateRange(quiz.createdAt, dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [quizzes, searchQuery, dateFilter]);

  if (isLoading) {
    return (
      <div className="rounded-(--radius-panel) border border-dashed border-border bg-cream py-12 text-center">
        <p className="font-display font-bold text-muted">Loading quizzes...</p>
      </div>
    );
  }

  const playable = quizzes.filter((q) => q.questionCount > 0);

  if (playable.length === 0) {
    return (
      <div className="rounded-(--radius-panel) border border-dashed border-border bg-cream px-6 py-12 text-center">
        <p className="font-display text-lg font-extrabold text-ink">
          No past quizzes yet
        </p>
        <p className="mt-1 text-sm text-muted">
          Upload a PDF or text file to make your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Label htmlFor="quiz-search" className="sr-only">
            Search quizzes
          </Label>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            id="quiz-search"
            type="text"
            placeholder="Search your quizzes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as DateFilter)}
        >
          <SelectTrigger
            aria-label="Filter by date created"
            className="h-11 w-full px-4 sm:w-44"
          >
            <CalendarDays size={14} className="text-muted" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Past week</SelectItem>
            <SelectItem value="month">Past month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="rounded-(--radius-panel) border border-dashed border-border bg-cream px-6 py-8 text-center">
          <p className="text-sm text-muted">
            No quizzes match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuizzes.map((quiz) => {
            const isSelected = quiz.id === selectedId;
            return (
              <button
                key={quiz.id}
                type="button"
                onClick={() => onSelect(quiz)}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between rounded-(--radius-panel) border bg-surface p-4 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-forest ${
                  isSelected
                    ? "border-forest ring-[3px] ring-forest/20"
                    : "border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-extrabold text-ink">
                    {quiz.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="font-mono">
                      {quiz.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <CalendarDays size={12} />
                      {formatDate(quiz.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
