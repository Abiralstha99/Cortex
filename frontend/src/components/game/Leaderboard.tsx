import { motion, useReducedMotion } from "motion/react";
import type { LeaderboardEntry } from "@/lib/api";
import { cn } from "@/lib/utils";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string | null;
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

export default function Leaderboard({ entries, highlightPlayerId }: LeaderboardProps) {
  const reduce = useReducedMotion();

  const rows = entries.map((entry) => (
    <div
      key={entry.playerId}
      className={cn(
        "flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2",
        entry.playerId === highlightPlayerId
          ? "border-forest bg-candy-yellow/35"
          : "border-transparent bg-background",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-track font-mono text-sm font-semibold tabular-nums text-muted">
          {entry.rank}
        </span>
        <span className="truncate font-display font-bold text-ink">{entry.username}</span>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
        {entry.score} pts
      </span>
    </div>
  ));

  return (
    <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 font-display text-lg font-extrabold text-ink">Leaderboard</h3>
      {reduce ? (
        <div className="space-y-1">{rows}</div>
      ) : (
        <motion.div
          className="space-y-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {entries.map((entry) => (
            <motion.div
              key={entry.playerId}
              variants={itemVariants}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2",
                entry.playerId === highlightPlayerId
                  ? "border-forest bg-candy-yellow/35"
                  : "border-transparent bg-background",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-track font-mono text-sm font-semibold tabular-nums text-muted">
                  {entry.rank}
                </span>
                <span className="truncate font-display font-bold text-ink">
                  {entry.username}
                </span>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                {entry.score} pts
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
