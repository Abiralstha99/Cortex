import type { LeaderboardEntry } from "@/lib/api";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string | null;
};

export default function Leaderboard({ entries, highlightPlayerId }: LeaderboardProps) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
      <h3 className="label-caps text-muted mb-4">Leaderboard</h3>
      <div className="space-y-1">
        {entries.map((entry) => (
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
        ))}
      </div>
    </div>
  );
}
