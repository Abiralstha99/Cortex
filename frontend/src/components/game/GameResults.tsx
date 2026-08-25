import { useNavigate } from "react-router-dom";
import type { GameFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";

type GameResultsProps = {
  gameResults: GameFinishedPayload;
  myPlayerId: string;
};

export default function GameResults({ gameResults, myPlayerId }: GameResultsProps) {
  const navigate = useNavigate();
  const { finalLeaderboard, winner } = gameResults;

  const isWinner = winner.playerId === myPlayerId;

  function handleExit() {
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-8">
        <h2 className="text-2xl font-bold text-ink mb-3">Game finished</h2>
        {isWinner ? (
          <p className="text-xl text-rose font-semibold">You won</p>
        ) : (
          <p className="text-lg text-muted">
            Winner: <strong className="text-ink">{winner.username}</strong>{" "}
            <span className="font-mono">({winner.score} pts)</span>
          </p>
        )}
      </div>

      <Leaderboard entries={finalLeaderboard} highlightPlayerId={myPlayerId} />

      <Button variant="rose" onClick={handleExit} className="w-full">
        Back to Dashboard
      </Button>
    </div>
  );
}
