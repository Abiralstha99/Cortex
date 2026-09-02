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
    <li
      key={entry.playerId}
      className={cn(
        "flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2",
        entry.rank === 1
          ? "border-warning/40 bg-accent-yellow/20"
          : "border-transparent bg-subtle",
        entry.playerId === highlightPlayerId &&
          (entry.rank === 1
            ? "ring-2 ring-primary"
            : "border-primary/40 bg-primary-soft"),
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold tabular-nums",
            entry.rank === 1
              ? "border-warning bg-accent-yellow text-ink"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          {entry.rank}
        </span>
        <span className="truncate font-display font-semibold text-ink">
          {entry.username}
        </span>
        {entry.playerId === highlightPlayerId && (
          <span className="shrink-0 text-xs font-semibold text-primary">You</span>
        )}
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
        {entry.score} pts
      </span>
    </li>
  ));

  return (
    <section className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 font-display text-xl font-bold text-ink">Leaderboard</h2>
      {reduce ? (
        <ol className="space-y-2">{rows}</ol>
      ) : (
        <motion.ol
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {entries.map((entry) => (
            <motion.li
              key={entry.playerId}
              variants={itemVariants}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2",
                entry.rank === 1
                  ? "border-warning/40 bg-accent-yellow/20"
                  : "border-transparent bg-subtle",
                entry.playerId === highlightPlayerId &&
                  (entry.rank === 1
                    ? "ring-2 ring-primary"
                    : "border-primary/40 bg-primary-soft"),
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold tabular-nums",
                    entry.rank === 1
                      ? "border-warning bg-accent-yellow text-ink"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  {entry.rank}
                </span>
                <span className="truncate font-display font-semibold text-ink">
                  {entry.username}
                </span>
                {entry.playerId === highlightPlayerId && (
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    You
                  </span>
                )}
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                {entry.score} pts
              </span>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </section>
  );
}
