import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import type { GameFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { EmphasisPill } from "@/components/brand/EmphasisPill";

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
      <section className="rounded-[var(--radius-panel)] border-4 border-white bg-candy-yellow/45 p-8 shadow-[0_10px_0_0_rgb(0_0_0/0.12)] ring-1 ring-candy-yellow sm:p-10">
        <h2 className="mb-4 text-balance font-display text-3xl font-extrabold text-ink">
          Game finished
        </h2>
        {isWinner ? (
          <EmphasisPill tone="forest" className="px-5 py-2 text-xl">
            You won
          </EmphasisPill>
        ) : (
          <p className="text-pretty text-lg text-muted">
            Winner: <strong className="font-display text-ink">{winner.username}</strong>{" "}
            <span className="font-mono font-semibold tabular-nums text-ink">
              ({winner.score} pts)
            </span>
          </p>
        )}
      </section>

      <Leaderboard entries={finalLeaderboard} highlightPlayerId={myPlayerId} />

      <Button variant="rose" onClick={handleExit} className="min-h-12 w-full">
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
