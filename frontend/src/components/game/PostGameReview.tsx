import { useCallback, useEffect, useState } from "react";
import type { AnswerValue, GameReview, GameReviewRound } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function answerLabel(round: GameReviewRound, answer: AnswerValue | null): string {
  if (answer === null) return "No answer submitted";
  if (round.type === "MCQ" && typeof answer === "number") {
    return round.options?.[answer] ?? String(answer);
  }
  if (typeof answer === "boolean") return answer ? "True" : "False";
  return String(answer);
}

export default function PostGameReview({ loadReview }: { loadReview: () => Promise<GameReview> }) {
  const [review, setReview] = useState<GameReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    loadReview().then((result) => {
      if (active) { setReview(result); setError(null); setLoading(false); }
    }).catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : "We couldn't load the review. Try again.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [loadReview, attempt]);

  return (
    <section aria-labelledby="post-game-review" className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 text-left shadow-card sm:p-6">
      <h2 id="post-game-review" className="font-display text-xl font-bold text-ink">Question review</h2>
      {loading ? <p role="status" className="mt-4 text-muted-foreground">Loading review...</p> : null}
      {error ? (
        <div role="alert" className="mt-4 space-y-3">
          <p className="text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" onClick={() => { setLoading(true); retry(); }}>Try again</Button>
        </div>
      ) : null}
      {review ? (
        <ol className="mt-4 divide-y divide-border">
          {review.rounds.map((round) => (
            <li key={round.roundNumber} className="py-5 first:pt-0 last:pb-0">
              <p className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">Round {round.roundNumber}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{round.question}</h3>
              <p className="mt-3 text-sm text-ink">Your answer: <strong className={cn(round.playerAnswer !== null && (round.correct ? "text-success-foreground" : "text-danger-foreground"))}>{answerLabel(round, round.playerAnswer)}</strong>
                {round.playerAnswer !== null && <span className={cn("ml-2 font-semibold", round.correct ? "text-success-foreground" : "text-danger-foreground")}>{round.correct ? "✓ Correct" : "✕ Incorrect"} · +{round.pointsEarned} pts</span>}
              </p>
              <p className="mt-1 text-sm text-ink">Correct answer: <strong>{round.correctAnswer}</strong></p>
              <p className="mt-3 text-pretty text-sm text-muted-foreground">{round.explanation}</p>
              {round.sources.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">From your notes</p>
                  {round.sources.map((source, index) => (
                    <blockquote key={`${source.chunkId}-${index}`} className="break-words border-l-2 border-border pl-3 text-sm text-muted-foreground">
                      “{source.quote}” <span className="font-mono text-xs">({source.chunkId})</span>
                    </blockquote>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-muted-foreground">Source excerpt unavailable for this quiz.</p>}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
