import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import type { GameFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";

type GameResultsProps = {
  gameResults: GameFinishedPayload;
  myPlayerId: string;
};

export default function GameResults({ gameResults, myPlayerId }: GameResultsProps) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { finalLeaderboard, winner } = gameResults;

  const isWinner = winner.playerId === myPlayerId;

  function handleExit() {
    navigate("/dashboard");
  }

  const content = (
    <>
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
    </>
  );

  if (reduce) {
    return <div className="space-y-6 text-center">{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      {content}
    </motion.div>
  );
}
