import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { LeaderboardEntry, RoundFinishedPayload } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = { roundResults: RoundFinishedPayload; myPlayerId: string };

function AnimatedScore({ from, to, duration, reduce, suffix = " pts", prefix = "" }: { from: number; to: number; duration: number; reduce: boolean; suffix?: string; prefix?: string }) {
  const [score, setScore] = useState(reduce || duration === 0 ? to : from);
  useEffect(() => {
    if (reduce || duration === 0) return;
    const control = animate(from, to, { duration, ease: "easeOut", onUpdate: (value) => setScore(Math.round(value)) });
    return () => control.stop();
  }, [from, to, duration, reduce]);
  return <span className="font-mono text-sm font-semibold tabular-nums text-ink">{prefix}{reduce || duration === 0 ? to : score}{suffix}</span>;
}

export default function RoundResults({ roundResults, myPlayerId }: Props) {
  const reduce = useReducedMotion();
  const { roundNumber, submissions, leaderboard, isLastRound } = roundResults;
  const previousLeaderboard = Array.isArray(roundResults.previousLeaderboard) ? roundResults.previousLeaderboard : leaderboard;
  const revealEndsAt = typeof roundResults.revealEndsAt === "number" && Number.isFinite(roundResults.revealEndsAt) ? roundResults.revealEndsAt : 0;
  const [remaining] = useState(() => Math.max(0, revealEndsAt - Date.now()));
  const animateReveal = Array.isArray(roundResults.previousLeaderboard) && !reduce && remaining > 250;
  const [revealed, setRevealed] = useState(!animateReveal);
  const [showMovement, setShowMovement] = useState(!animateReveal);
  const [expired, setExpired] = useState(remaining === 0);
  const revealDelay = Math.min(1400, remaining * 0.35);
  const moveDuration = Math.min(650, remaining * 0.25);

  useEffect(() => {
    if (!animateReveal) return;
    const revealTimer = window.setTimeout(() => setRevealed(true), revealDelay);
    const movementTimer = window.setTimeout(() => setShowMovement(true), revealDelay + moveDuration);
    return () => { window.clearTimeout(revealTimer); window.clearTimeout(movementTimer); };
  }, [animateReveal, revealDelay, moveDuration]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setExpired(true), Math.max(0, revealEndsAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [revealEndsAt]);

  const previous = new Map(previousLeaderboard.map((entry) => [entry.playerId, entry]));
  const final = new Map(leaderboard.map((entry) => [entry.playerId, entry]));
  const displayed = revealed ? leaderboard : previousLeaderboard;
  const mySubmission = submissions.find((entry) => entry.playerId === myPlayerId);

  return (
    <section className="editorial-round-results space-y-5" aria-label={`Round ${roundNumber} leaderboard`}>
      <header className="editorial-stage rounded-[var(--radius-panel)] border border-primary/20 bg-primary-soft p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Round {roundNumber} complete</p>
        <h1 tabIndex={-1} className="mt-2 font-display text-2xl font-bold text-ink">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">{!mySubmission?.submitted ? "No answer submitted" : mySubmission.correct ? `Correct · +${mySubmission.pointsEarned} pts` : "Not quite · +0 pts"}</p>
      </header>
      <ol className="max-h-[min(58vh,34rem)] space-y-2 overflow-y-auto rounded-[var(--radius-panel)] border border-border bg-surface p-3 sm:p-5" aria-label="Standings">
        {displayed.map((entry: LeaderboardEntry) => {
          const previousEntry = previous.get(entry.playerId) ?? entry;
          const finalEntry = final.get(entry.playerId) ?? entry;
          const change = previousEntry.rank - finalEntry.rank;
          const earned = submissions.find((submission) => submission.playerId === entry.playerId)?.pointsEarned ?? 0;
          return (
            <motion.li key={entry.playerId} layout={!reduce} transition={{ layout: { duration: moveDuration / 1000, ease: "easeInOut" } }}
              data-rank={revealed ? finalEntry.rank : previousEntry.rank}
              className={cn("flex min-h-16 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2", entry.playerId === myPlayerId ? "border-primary bg-primary-soft" : "border-border bg-subtle")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 font-mono text-lg font-semibold tabular-nums">{revealed ? finalEntry.rank : previousEntry.rank}</span>
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{entry.username}{entry.playerId === myPlayerId ? <span className="ml-2 text-xs text-primary">You</span> : null}</p>
                  <p className="text-xs text-muted-foreground"><AnimatedScore from={0} to={earned} duration={animateReveal ? Math.min(1.3, remaining / 3000) : 0} reduce={!!reduce} prefix="+" suffix="" /> this round</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showMovement && <span aria-label={change > 0 ? `Up ${change} ranks` : change < 0 ? `Down ${-change} ranks` : "Rank unchanged"} className={cn("text-sm font-bold", change > 0 ? "text-success-foreground" : change < 0 ? "text-danger-foreground" : "text-muted-foreground")}>{change > 0 ? `↑${change}` : change < 0 ? `↓${-change}` : "—"}</span>}
                <AnimatedScore from={previousEntry.score} to={finalEntry.score} duration={animateReveal ? Math.min(1.3, remaining / 3000) : 0} reduce={!!reduce} />
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p role="status" className="text-center text-sm font-semibold text-muted-foreground">
        {expired && isLastRound ? "Saving final results…" : expired ? "Loading next question…" : isLastRound ? "Final results are coming up…" : "Next question is coming up…"}
      </p>
    </section>
  );
}
