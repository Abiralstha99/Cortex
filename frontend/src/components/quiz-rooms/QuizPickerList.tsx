import { useMemo, useState } from "react";
import { ChevronRight, Search, CalendarDays } from "lucide-react";
import type { QuizSummary } from "@/lib/api";
import { Input } from "@/components/ui/input";
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
      <div className="rounded-[var(--radius-panel)] border border-dashed border-border bg-surface py-12 text-center">
        <p className="text-sm text-muted">Loading quizzes...</p>
      </div>
    );
  }

  const playable = quizzes.filter((q) => q.questionCount > 0);

  if (playable.length === 0) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-medium text-ink">No past quizzes available</p>
        <p className="mt-1 text-sm text-muted">
          Upload a PDF to generate your first quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Date filter */}
        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as DateFilter)}
        >
          <SelectTrigger aria-label="Filter by date created">
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

      {/* Results */}
      {filteredQuizzes.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-border bg-surface px-6 py-8 text-center">
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
                className={`flex w-full items-center justify-between rounded-[var(--radius-panel)] border bg-surface p-4 text-left transition-colors hover:border-rose ${
                  isSelected ? "border-rose ring-2 ring-rose/30" : "border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{quiz.title}</p>
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
