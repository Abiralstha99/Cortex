import { useAuth, useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { clearPracticeAnswer, getPracticeSession, savePracticeAnswer, submitPractice, type PracticeAnswer, type PracticeSession } from "@/lib/api";
import { resumePracticeIndex, samePracticeAnswer } from "./practiceNavigation";

function savedAnswer(session: PracticeSession, questionId: string): PracticeAnswer | null {
  return session.answers.find((answer) => answer.questionId === questionId)?.answer ?? null;
}

export default function PracticePlayer() {
  const { sessionId = "" } = useParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const entryKey = `${user?.id ?? ""}:${sessionId}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["practice-session", user?.id, sessionId], queryFn: async () => getPracticeSession(await getToken(), sessionId), enabled: false });
  const refetch = query.refetch;
  useEffect(() => {
    if (!user?.id || !sessionId) return;
    let mounted = true;
    void refetch().then(() => { if (mounted) setReadyKey(entryKey); });
    return () => { mounted = false; };
  }, [entryKey, refetch, sessionId, user?.id]);
  if (readyKey !== entryKey) return <PageShell maxWidth="5xl"><p>Loading practice…</p></PageShell>;
  if (query.isLoading) return <PageShell maxWidth="5xl"><p>Loading practice…</p></PageShell>;
  if (query.isError) return <PageShell maxWidth="5xl"><p role="alert" className="text-danger">{query.error.message}</p></PageShell>;
  if (!query.data) return <PageShell maxWidth="5xl"><p>Loading practice…</p></PageShell>;
  if (query.data.status === "COMPLETED") return <Navigate to={`/practice/quizzes/${query.data.quizId}/results/latest`} replace />;
  return <ActivePractice key={query.data.id} initial={query.data} />;
}

function ActivePractice({ initial }: { initial: PracticeSession }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [session, setSession] = useState<PracticeSession>(initial);
  const [index, setIndex] = useState(initial.resumeIndex);
  const [draft, setDraft] = useState<PracticeAnswer | null>(initial.resumeIndex < 0 ? null : savedAnswer(initial, initial.questions[initial.resumeIndex]!.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowNavigation = useRef(false);

  const question = index >= 0 ? session?.questions[index] : undefined;
  const saved = session && question ? savedAnswer(session, question.id) : null;
  const dirty = !!question && !samePracticeAnswer(draft, saved);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !allowNavigation.current && (dirty || busy) && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Leave practice? Your unsaved answer will be lost.")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", unload);
    return () => { window.removeEventListener("beforeunload", unload); };
  }, [dirty]);

  async function persist(): Promise<PracticeSession | null> {
    if (!session || !question || !dirty) return session;
    try {
      const token = await getToken();
      if (draft) await savePracticeAnswer(token, session.id, question.id, draft);
      else await clearPracticeAnswer(token, session.id, question.id);
      const answers = session.answers.filter((answer) => answer.questionId !== question.id);
      if (draft) answers.push({ questionId: question.id, answer: draft });
      const next = { ...session, answers };
      setSession(next); setError(null);
      queryClient.setQueryData(["practice-session", user?.id, session.id], next);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save answer. Try again.");
      return null;
    }
  }

  async function move(target: number | "review" | "exit") {
    if (!session || busy) return;
    setBusy(true);
    const next = await persist();
    if (next) {
      if (target === "exit") { allowNavigation.current = true; navigate("/practice"); }
      else if (target === "review") setIndex(-1);
      else { setIndex(target); setDraft(savedAnswer(next, next.questions[target]!.id)); }
    }
    setBusy(false);
  }

  async function submit() {
    if (!session || busy) return;
    setBusy(true); setError(null);
    try {
      await submitPractice(await getToken(), session.id);
      void queryClient.invalidateQueries({ queryKey: ["practice-library", user?.id] });
      allowNavigation.current = true;
      navigate(`/practice/quizzes/${session.quizId}/results/latest`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit practice"); }
    finally { setBusy(false); }
  }

  const answered = session?.answers.map((answer) => answer.questionId) ?? [];
  const firstUnanswered = session ? resumePracticeIndex(session.questions.map((q) => q.id), answered) : -1;
  return <PageShell maxWidth="5xl" className="editorial-practice">
    <Link to="/practice" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:underline">← Practice library</Link>
    {session && <>
      <header className="mt-6 border-b border-border pb-6"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Untimed practice</p><h1 className="mt-2 font-serif text-3xl text-ink sm:text-5xl">{session.title}</h1><p className="mt-2 text-sm text-muted-foreground">{answered.length} of {session.questions.length} answered</p></header>
      <nav aria-label="Question navigator" className="mt-6 flex flex-wrap gap-2">{session.questions.map((item, position) => <button key={item.id} type="button" aria-label={`Question ${position + 1}, ${answered.includes(item.id) ? "answered" : "unanswered"}`} aria-current={index === position ? "step" : undefined} disabled={busy} onClick={() => void move(position)} className={`grid size-11 place-items-center rounded-full border text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${index === position ? "border-ink bg-ink text-white" : answered.includes(item.id) ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-ink"}`}>{position + 1}</button>)}</nav>
      {index < 0 ? <section className="mt-10"><h2 className="font-serif text-3xl text-ink">Review your answers</h2><p className="mt-3 text-muted-foreground">Your answers are saved. Correct answers and explanations appear after submission.</p><p className="mt-5 font-semibold">{answered.length}/{session.questions.length} answered</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => void submit()} disabled={busy || firstUnanswered >= 0}>Submit practice</Button>{firstUnanswered >= 0 && <Button variant="outline" onClick={() => void move(firstUnanswered)}>Answer question {firstUnanswered + 1}</Button>}<Button variant="outline" onClick={() => void move("exit")}>Save and exit</Button></div></section>
        : question && <section className="mt-10" aria-labelledby="practice-question"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Question {index + 1} of {session.questions.length}</p><h2 id="practice-question" className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-ink sm:text-4xl">{question.question}</h2>
          <div className="mt-8 max-w-2xl space-y-3">{question.type === "MCQ" && question.options?.map((option, choice) => <label key={choice} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"><input type="radio" disabled={busy} name={`answer-${question.id}`} checked={draft !== null && "selectedIndex" in draft && draft.selectedIndex === choice} onChange={() => setDraft({ selectedIndex: choice })} /><span>{option}</span></label>)}
            {question.type === "TRUE_FALSE" && [true, false].map((value) => <label key={String(value)} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"><input type="radio" disabled={busy} name={`answer-${question.id}`} checked={draft !== null && "answer" in draft && draft.answer === value} onChange={() => setDraft({ answer: value })} /><span>{value ? "True" : "False"}</span></label>)}
            {question.type === "FILL_BLANK" && <label className="block text-sm font-semibold text-ink">Your answer<input disabled={busy} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base font-normal focus-visible:outline-2 focus-visible:outline-primary" value={draft && "answer" in draft && typeof draft.answer === "string" ? draft.answer : ""} onChange={(event) => setDraft(event.target.value.trim() ? { answer: event.target.value } : null)} /></label>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Button variant="outline" disabled={busy || index === 0} onClick={() => void move(index - 1)}>Previous</Button><Button disabled={busy} onClick={() => void move(index === session.questions.length - 1 ? "review" : index + 1)}>{index === session.questions.length - 1 ? "Review answers" : "Next"}</Button><Button variant="outline" disabled={busy} onClick={() => setDraft(null)}>Clear answer</Button><Button variant="outline" disabled={busy} onClick={() => void move("exit")}>Save and exit</Button></div>
        </section>}
      {error && <p role="alert" className="mt-5 text-danger">{error} Your answer is still here.</p>}
    </>}
  </PageShell>;
}
