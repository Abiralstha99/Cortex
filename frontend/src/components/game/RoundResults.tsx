import { motion, useReducedMotion } from "motion/react";
import type { RoundFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";
import { cn } from "@/lib/utils";

type RoundResultsProps = {
  roundResults: RoundFinishedPayload;
  myPlayerId: string;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 28 },
  },
};

export default function RoundResults({ roundResults, myPlayerId }: RoundResultsProps) {
  const { roundNumber, correctAnswer, submissions, leaderboard, isLastRound, nextRoundIn } = roundResults;
  const reduce = useReducedMotion();

  const submissionRows = submissions.map((sub) => {
    const player = leaderboard.find((p) => p.playerId === sub.playerId);
    return (
      <div
        key={sub.playerId}
        className={cn(
          "flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border px-4 py-2",
          sub.playerId === myPlayerId
            ? "border-forest bg-candy-yellow/35"
            : "border-transparent bg-background",
        )}
      >
        <span className="font-display font-bold text-ink">{player?.username ?? "Unknown"}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", sub.correct ? "text-success" : "text-danger")}>
            {sub.correct ? "Correct" : "Wrong"}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-ink">
            +{sub.pointsEarned}
          </span>
          {sub.placement && (
            <span className="rounded-full bg-track px-2 py-1 font-mono text-xs font-semibold text-muted">
              {sub.placement === 1 ? "1st" : sub.placement === 2 ? "2nd" : sub.placement === 3 ? "3rd" : `${sub.placement}th`}
            </span>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-panel)] border-4 border-white bg-candy-sky/35 p-6 shadow-[0_8px_0_0_rgb(0_0_0/0.10)] ring-1 ring-candy-sky">
        <h2 className="mb-2 text-balance font-display text-2xl font-extrabold text-ink">
          Round {roundNumber} Complete
        </h2>
        <p className="text-pretty text-muted">
          Correct answer:{" "}
          <strong className="rounded-full bg-surface px-3 py-1 font-display font-extrabold text-forest">
            {correctAnswer}
          </strong>
        </p>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 font-display text-lg font-extrabold text-ink">Submissions</h3>
        {reduce ? (
          <div className="space-y-1">{submissionRows}</div>
        ) : (
          <motion.div
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {submissions.map((sub) => {
              const player = leaderboard.find((p) => p.playerId === sub.playerId);
              return (
                <motion.div
                  key={sub.playerId}
                  variants={itemVariants}
                  className={cn(
                    "flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border px-4 py-2",
                    sub.playerId === myPlayerId
                      ? "border-forest bg-candy-yellow/35"
                      : "border-transparent bg-background",
                  )}
                >
                  <span className="font-display font-bold text-ink">
                    {player?.username ?? "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", sub.correct ? "text-success" : "text-danger")}>
                      {sub.correct ? "Correct" : "Wrong"}
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                      +{sub.pointsEarned}
                    </span>
                    {sub.placement && (
                      <span className="rounded-full bg-track px-2 py-1 font-mono text-xs font-semibold text-muted">
                        {sub.placement === 1 ? "1st" : sub.placement === 2 ? "2nd" : sub.placement === 3 ? "3rd" : `${sub.placement}th`}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <Leaderboard entries={leaderboard} highlightPlayerId={myPlayerId} />

      {!isLastRound && (
        <p className="text-center font-mono text-sm font-semibold tabular-nums text-muted">
          Next round in {Math.ceil(nextRoundIn / 1000)}s...
        </p>
      )}
    </div>
  );
}
