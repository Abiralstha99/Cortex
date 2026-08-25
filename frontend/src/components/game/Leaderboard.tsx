import { motion, useReducedMotion } from "motion/react";
import type { LeaderboardEntry } from "@/lib/api";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" as const } },
};

export default function Leaderboard({ entries, highlightPlayerId }: LeaderboardProps) {
  const reduce = useReducedMotion();

  const rows = entries.map((entry) => (
    <div
      key={entry.playerId}
      className={`flex items-center justify-between rounded-[var(--radius-control)] px-4 py-2 ${
        entry.playerId === highlightPlayerId ? "bg-rose/5 border border-rose/20" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-muted w-6 text-right">
          {entry.rank}
        </span>
        <span className="text-ink font-medium">{entry.username}</span>
      </div>
      <span className="font-mono text-sm text-muted">{entry.score} pts</span>
    </div>
  ));

  return (
    <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
      <h3 className="label-caps text-muted mb-4">Leaderboard</h3>
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
              className={`flex items-center justify-between rounded-[var(--radius-control)] px-4 py-2 ${
                entry.playerId === highlightPlayerId ? "bg-rose/5 border border-rose/20" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-muted w-6 text-right">
                  {entry.rank}
                </span>
                <span className="text-ink font-medium">{entry.username}</span>
              </div>
              <span className="font-mono text-sm text-muted">{entry.score} pts</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
