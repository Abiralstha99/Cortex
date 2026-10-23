import { useAuth, useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteSoloQuiz, getPracticeLibrary, startPractice, type PracticeQuiz } from "@/lib/api";

export default function PracticeLibrary() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const library = useQuery({ queryKey: ["practice-library", user?.id], queryFn: async () => getPracticeLibrary(await getToken()), enabled: Boolean(user?.id) });

  async function open(quiz: PracticeQuiz) {
    setBusy(quiz.id); setError(null);
    try {
      const session = await startPractice(await getToken(), quiz.id, false);
      navigate(`/practice/sessions/${session.id}`);
      void queryClient.invalidateQueries({ queryKey: ["practice-library", user?.id] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start practice"); }
    finally { setBusy(null); }
  }

  async function remove(quiz: PracticeQuiz) {
    if (!window.confirm(`Delete “${quiz.title}”? Its questions, practice attempts, answers, and results will be permanently deleted.`)) return;
    setBusy(quiz.id); setError(null);
    try {
      await deleteSoloQuiz(await getToken(), quiz.id);
      queryClient.setQueryData<{ created: PracticeQuiz[]; played: PracticeQuiz[] }>(["practice-library", user?.id], (current) => current && { ...current, created: current.created.filter((item) => item.id !== quiz.id) });
      void queryClient.invalidateQueries({ queryKey: ["practice-library", user?.id] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete quiz"); }
    finally { setBusy(null); }
  }

  function rows(quizzes: PracticeQuiz[], empty: string) {
    if (quizzes.length === 0) return <p className="mt-8 text-muted-foreground">{empty}</p>;
    return <div className="mt-6 divide-y divide-border border-y border-border">{quizzes.map((quiz) => {
      const status = quiz.unfinished ? `In progress · ${quiz.unfinished.answeredCount}/${quiz.questionCount} answered`
        : quiz.latestResult ? `Completed · Latest score ${quiz.latestResult.score}/${quiz.questionCount}` : "Not started";
      const action = quiz.unfinished ? "Resume" : quiz.latestResult ? "Practice again" : "Start practice";
      return <article key={quiz.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0"><h2 className="font-serif text-xl text-ink">{quiz.title}</h2><p className="mt-1 text-sm text-muted-foreground">{quiz.questionCount} questions</p><p className="mt-1 text-sm font-medium text-ink">{status}</p></div>
        <div className="flex flex-wrap gap-2 sm:shrink-0"><Button disabled={busy === quiz.id} onClick={() => void open(quiz)}>{action}</Button>
          {!quiz.unfinished && quiz.latestResult && <Button variant="outline" asChild><Link to={`/practice/quizzes/${quiz.id}/results/latest`}>View results</Link></Button>}
          {quiz.classification === "SOLO_ONLY" && <DropdownMenu>
            <DropdownMenuTrigger aria-label={`Quiz actions for ${quiz.title}`} disabled={busy === quiz.id} className="grid size-11 place-items-center rounded-full border border-border bg-surface text-ink hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-primary/30 disabled:opacity-50"><MoreHorizontal className="size-5" aria-hidden="true" /></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem className="min-h-11 text-danger" onSelect={() => void remove(quiz)}>Delete quiz</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </article>;
    })}</div>;
  }

  return <PageShell maxWidth="5xl" className="editorial-practice">
    <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:underline">← Back to dashboard</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><h1 className="font-serif text-4xl text-ink sm:text-6xl">Practice library</h1><Button asChild variant="outline"><Link to="/practice/create">Create practice quiz</Link></Button></div>
    <p className="mt-3 max-w-2xl text-muted-foreground">Take your time. Pick up where you left off, or try again from the beginning.</p>
    {library.isLoading && <p className="mt-8">Loading quizzes…</p>}
    {library.isError && <p className="mt-8 text-danger" role="alert">{library.error.message} <Button variant="outline" onClick={() => void library.refetch()}>Try again</Button></p>}
    {error && <p className="mt-6 text-danger" role="alert">{error}</p>}
    {library.data && !library.isError && <Tabs defaultValue="created" className="mt-10">
      <TabsList variant="line" aria-label="Practice quiz groups" className="flex h-auto w-full justify-start gap-4 border-b border-border sm:gap-8">
        <TabsTrigger value="created" className="min-h-11 min-w-0 whitespace-normal px-1 text-center leading-snug sm:px-2">Created by me</TabsTrigger>
        <TabsTrigger value="played" className="min-h-11 min-w-0 whitespace-normal px-1 text-center leading-snug sm:px-2">Played with friends</TabsTrigger>
      </TabsList>
      <TabsContent value="created">{rows(library.data.created, "No created quizzes are ready for practice yet.")}</TabsContent>
      <TabsContent value="played">{rows(library.data.played, "No quizzes you played with friends are ready for practice yet.")}</TabsContent>
    </Tabs>}
  </PageShell>;
}
