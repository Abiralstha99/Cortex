import { useAuth, useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { getLatestPracticeResult } from "@/lib/api";

function answerLabel(answer: { selectedIndex: number } | { answer: boolean } | { answer: string } | undefined, options?: string[]) {
  if (!answer) return "No answer";
  if ("selectedIndex" in answer) return options?.[answer.selectedIndex] ?? `Option ${answer.selectedIndex + 1}`;
  if (typeof answer.answer === "boolean") return answer.answer ? "True" : "False";
  return answer.answer;
}

export default function PracticeResult() {
  const { quizId = "" } = useParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const result = useQuery({ queryKey: ["practice-result", user?.id, quizId], queryFn: async () => getLatestPracticeResult(await getToken(), quizId), enabled: Boolean(user?.id && quizId) });
  return <PageShell maxWidth="5xl" className="editorial-practice">
    <Link to="/practice" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:underline">← Practice library</Link>
    {result.isLoading && <p className="mt-8">Loading result…</p>}
    {result.isError && <p role="alert" className="mt-8 text-danger">{result.error.message}</p>}
    {result.data && !result.isError && <><header className="mt-7 border-b border-border pb-8"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Latest practice result</p><h1 className="mt-2 font-serif text-4xl text-ink sm:text-6xl">{result.data.title}</h1><p className="mt-4 text-lg font-semibold">{result.data.score} of {result.data.questions.length} correct · {Math.round(((result.data.score ?? 0) / result.data.questions.length) * 100)}%</p></header>
      <ol className="divide-y divide-border">{result.data.questions.map((question, index) => {
        const response = result.data.answers.find((answer) => answer.questionId === question.id);
        return <li key={question.id} className="py-8"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Question {index + 1}</p><h2 className="mt-2 font-serif text-2xl text-ink">{question.question}</h2><p className="mt-4">Your answer: <strong>{answerLabel(response?.answer, question.options)}</strong> · <span className={response?.isCorrect ? "text-success" : "text-danger"}>{response?.isCorrect ? "Correct" : "Incorrect"}</span></p><p className="mt-2">Correct answer: <strong>{question.correctAnswer}</strong></p><p className="mt-3 text-muted-foreground">{question.explanation}</p></li>;
      })}</ol></>}
  </PageShell>;
}
