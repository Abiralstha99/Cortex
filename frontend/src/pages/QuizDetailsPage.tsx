import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteQuiz, getQuiz, startPractice } from "@/lib/api";

export default function QuizDetailsPage() {
  const { quizId = "" } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const quizQuery = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => getQuiz(await getToken(), quizId),
    enabled: Boolean(quizId),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => deleteQuiz(await getToken(), quizId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => setDeleteError(error.message),
  });
  const practiceMutation = useMutation({
    mutationFn: async () => startPractice(await getToken(), quizId),
    onSuccess: (session) => navigate(`/practice/sessions/${session.id}`),
    onError: (error: Error) => setDeleteError(error.message),
  });

  const quiz = quizQuery.data;
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : null;
  return (
    <PageShell maxWidth="5xl" className="editorial-quiz-details">
      <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline">← Back to dashboard</Link>
      {quizQuery.isLoading && <div className="mt-8 space-y-5" aria-label="Loading quiz"><Skeleton className="h-14 w-3/4" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
      {quizQuery.isError && <div className="mt-8" role="alert"><p>{quizQuery.error.message}</p><Button variant="outline" className="mt-4" onClick={() => void quizQuery.refetch()}>Try again</Button></div>}
      {quiz && <>
        <div className="mt-7 flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8 sm:mt-10">
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-serif text-4xl leading-tight text-ink sm:text-6xl">{quiz.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}</p>
          </div>
          <div className="flex items-center gap-2">
            {quiz.classification !== "SOLO_ONLY" && <Button disabled={deleteMutation.isPending} onClick={() => navigate("/game/create", { state: { quizId } })}>Host game</Button>}
            <Button variant="outline" disabled={practiceMutation.isPending} onClick={() => practiceMutation.mutate()}>Practice quiz</Button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Quiz actions" disabled={deleteMutation.isPending} className="grid size-11 place-items-center rounded-full border border-border bg-surface hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"><MoreHorizontal className="size-5" /></DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem className="text-danger" onSelect={() => { if (window.confirm(`Delete “${quiz.title}”? Its practice attempts, answers, and results will also be deleted. This cannot be undone.`)) { setDeleteError(null); deleteMutation.mutate(); } }}>Delete quiz</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {deleteMutation.isPending && <p role="status" className="mt-3 text-sm font-semibold text-muted-foreground">Deleting quiz...</p>}
        {deleteError && <p role="alert" className="mt-4 text-sm text-danger">{deleteError}</p>}
        <section className="mt-10" aria-labelledby="quiz-questions-heading">
          <h2 id="quiz-questions-heading" className="font-serif text-3xl text-ink">Questions</h2>
          {questions === null ? <p className="mt-5 text-sm text-muted-foreground">Question previews are unavailable right now.</p> : <ol className="mt-5 border-t border-border">
            {questions.map((question, index) => <li key={question.id} className="border-b border-border">
              <details className="group">
                <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 py-4 text-left [&::-webkit-details-marker]:hidden">
                  <span className="w-8 shrink-0 text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 font-semibold text-ink">{question.question}</span>
                  <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-5 pl-12 text-sm text-muted-foreground">
                  <p>{question.type === "MCQ" ? "Multiple choice" : question.type === "TRUE_FALSE" ? "True or false" : "Fill in the blank"}</p>
                  {question.options && <ul className="mt-3 list-inside list-disc space-y-1">{question.options.map((option, optionIndex) => <li key={optionIndex}>{option}</li>)}</ul>}
                  {question.type === "TRUE_FALSE" && <p className="mt-3">True · False</p>}
                </div>
              </details>
            </li>)}</ol>}
        </section>
      </>}
    </PageShell>
  );
}
