import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { listQuizzes, type QuizSummary } from "@/lib/api";
import { ChevronRight } from "lucide-react";

const QUIZZES_QUERY_KEY = ["quizzes"] as const;

export default function QuizRows({ showEmptyState = false }: { showEmptyState?: boolean }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  // Register hooks first; enable fetching only when auth is ready.
  const query = useQuery({
    queryKey: QUIZZES_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      return listQuizzes(token);
    },
    enabled: isLoaded && isSignedIn,
  });

  // After hooks are registered, short-circuit rendering for unauthenticated users.
  if (!isLoaded || !isSignedIn) return null;

  if (query.isLoading) {
    return (
      <section aria-label="quizzes-loading">
        {showEmptyState && <h2 className="mb-5 text-sm font-semibold leading-5 text-ink">Your quizzes</h2>}
        <div className={showEmptyState ? "space-y-3" : ""}>
          {(showEmptyState ? [0, 1, 2] : [0]).map((item) => (
            <Skeleton key={item} className={showEmptyState ? "h-16 w-full" : "h-6 w-32"} />
          ))}
        </div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <div className={showEmptyState ? "border-t border-border py-8" : "inline-flex items-center space-x-2"} aria-label="quizzes-error">
        <span className="text-sm leading-5 text-text-muted">Could not load quizzes</span>
        <button onClick={() => void query.refetch()} className="ml-3 min-h-11 text-sm leading-5 text-primary underline underline-offset-2">
          Try again
        </button>
      </div>
    );
  }

  const quizzes: QuizSummary[] = query.data ?? [];
  if (quizzes.length === 0) {
    return showEmptyState ? (
      <section aria-label="Your quizzes">
        <h2 className="text-sm font-semibold leading-5 text-ink">Your quizzes</h2>
        <div className="mt-5 border-t border-border py-8">
          <p className="font-serif text-2xl text-ink">No quizzes yet.</p>
          <p className="mt-2 text-muted-foreground">Upload notes to make your first one.</p>
          <button className="mt-5 min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground" onClick={() => navigate("/game/create")}>Create a quiz</button>
        </div>
      </section>
    ) : null;
  }

  return (
    <section aria-label="Your quizzes">
      <h2 className="text-sm font-semibold leading-5 text-ink">Your quizzes</h2>
      <ul className="mt-2 space-y-1">
        {quizzes.map((q) => (
          <li key={q.id}>
            <button
              className="flex min-h-11 w-full min-w-0 items-center rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => navigate("/game/create", { state: { quizId: q.id } })}
            >
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-ink">{q.title}</span>
                <span className="ml-4 flex shrink-0 items-center gap-2 text-xs leading-4 text-text-muted">
                  {q.questionCount} questions
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
