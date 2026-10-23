import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import UploadPanel from "@/components/quiz-rooms/UploadPanel";
import { Button } from "@/components/ui/button";
import { generateQuiz, getQuizJob, startPractice } from "@/lib/api";

export default function CreatePracticeQuiz() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(10);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = useQuery({
    queryKey: ["solo-quiz-job", jobId],
    queryFn: async () => getQuizJob(await getToken(), jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => query.state.data?.status === "processing" ? 1500 : false,
    retry: 2,
  });

  useEffect(() => {
    if (job.data?.status === "completed" || job.data?.status === "ready") {
      void queryClient.invalidateQueries({ queryKey: ["practice-library", user?.id] });
    }
  }, [job.data?.status, queryClient, user?.id]);

  async function submit() {
    if (!file) { setError("Choose a PDF or TXT file first."); return; }
    setSubmitting(true); setError(null); setJobId(null);
    try {
      const result = await generateQuiz(await getToken(), file, count, title, true);
      if (!result.jobId) throw new Error("Generation did not start. Try again.");
      setJobId(result.jobId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start generation"); }
    finally { setSubmitting(false); }
  }

  async function start(quizId: string) {
    setStarting(true); setError(null);
    try {
      const session = await startPractice(await getToken(), quizId);
      navigate(`/practice/sessions/${session.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start practice"); }
    finally { setStarting(false); }
  }

  const readyQuizId = job.data?.status === "ready" || job.data?.status === "completed" ? job.data.quizId : undefined;
  return <PageShell maxWidth="3xl" className="editorial-practice">
    <Link to="/practice" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:underline">← Back to practice library</Link>
    <h1 className="mt-8 font-serif text-4xl text-ink sm:text-6xl">Create practice quiz</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Upload your notes and make a quiz just for solo practice.</p>
    <div className="mt-10"><UploadPanel file={file} onFileChange={setFile} title={title} onTitleChange={setTitle} count={count} onCountChange={setCount} /></div>
    {error && <p role="alert" className="mt-5 text-sm text-danger">{error}</p>}
    {job.isError && <p role="alert" className="mt-5 text-sm text-danger">Could not check generation. <Button variant="outline" onClick={() => void job.refetch()}>Try again</Button></p>}
    {job.data?.status === "failed" && <p role="alert" className="mt-5 text-sm text-danger">{job.data.errorMessage ?? job.data.error ?? "Could not generate questions."}</p>}
    {(submitting || (jobId && (!job.data || job.data.status === "processing") && !job.isError)) && <p role="status" className="mt-5 text-sm text-muted-foreground">Generating questions from your notes…</p>}
    {readyQuizId ? <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6"><p className="w-full font-serif text-2xl text-ink">Your quiz is ready.</p><Button disabled={starting} onClick={() => void start(readyQuizId)}>Start practice</Button><Button variant="outline" asChild><Link to="/practice">View library</Link></Button></div>
      : <Button className="mt-8" disabled={submitting || Boolean(jobId && job.data?.status === "processing")} onClick={() => void submit()}>{job.data?.status === "failed" ? "Try again" : "Generate questions"}</Button>}
  </PageShell>;
}
