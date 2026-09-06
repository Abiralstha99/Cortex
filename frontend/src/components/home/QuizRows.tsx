import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { listQuizzes, type QuizSummary } from "@/lib/api";

const QUIZZES_QUERY_KEY = ["quizzes"] as const;

export default function QuizRows() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: QUIZZES_QUERY_KEY,
    queryFn: async () => listQuizzes(null),
  });

  if (!isLoaded || !isSignedIn) return null;

  if (query.isLoading) {
    return <div aria-label="quizzes-loading"><Skeleton className="h-6 w-32" /></div>;
  }

  if (query.isError) {
    return (
      <div className="inline-flex items-center space-x-2" aria-label="quizzes-error">
        <span className="text-sm text-ink-muted">Could not load quizzes</span>
        <button onClick={() => void query.refetch()} className="underline text-sm">Try again</button>
      </div>
    );
  }

  const quizzes: QuizSummary[] = query.data ?? [];
  if (quizzes.length === 0) return null;

  return (
    <section aria-label="Your quizzes">
      <h2 className="text-sm font-medium text-ink-muted">Your quizzes</h2>
      <ul className="mt-2 space-y-1">
        {quizzes.map((q) => (
          <li key={q.id}>
            <button
              className="w-full text-left px-2 py-2 rounded hover:bg-surface/80"
              onClick={() => navigate("/game/create", { state: { quizId: q.id } })}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{q.title}</span>
                <span className="ml-4 text-xs text-ink-muted">{q.questionCount} questions</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

