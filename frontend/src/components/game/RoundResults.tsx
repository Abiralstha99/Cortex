import type { RoundFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";

type RoundResultsProps = {
  roundResults: RoundFinishedPayload;
  myPlayerId: string;
};

export default function RoundResults({ roundResults, myPlayerId }: RoundResultsProps) {
  const { roundNumber, correctAnswer, submissions, leaderboard, isLastRound, nextRoundIn } = roundResults;

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold text-ink mb-1">
          Round {roundNumber} Complete
        </h2>
        <p className="text-muted">
          Correct Answer: <strong className="text-ink">{correctAnswer}</strong>
        </p>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
        <h3 className="label-caps text-muted mb-4">Submissions</h3>
        <div className="space-y-1">
          {submissions.map((sub) => {
            const player = leaderboard.find((p) => p.playerId === sub.playerId);
            return (
              <div
                key={sub.playerId}
                className={`flex items-center justify-between rounded-[var(--radius-control)] px-4 py-2 ${
                  sub.playerId === myPlayerId ? "bg-rose/5 border border-rose/20" : "bg-background"
                }`}
              >
                <span className="text-ink font-medium">{player?.username ?? "Unknown"}</span>
                <div className="flex items-center gap-3">
                  <span className={sub.correct ? "text-success" : "text-danger"}>
                    {sub.correct ? "Correct" : "Wrong"}
                  </span>
                  <span className="font-mono text-sm text-muted">+{sub.pointsEarned}</span>
                  {sub.placement && (
                    <span className="font-mono text-xs text-muted">
                      {sub.placement === 1 ? "1st" : sub.placement === 2 ? "2nd" : sub.placement === 3 ? "3rd" : `${sub.placement}th`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Leaderboard entries={leaderboard} highlightPlayerId={myPlayerId} />

      {!isLastRound && (
        <p className="text-center text-sm text-muted">
          Next round in {Math.ceil(nextRoundIn / 1000)}s...
        </p>
      )}
    </div>
  );
}
