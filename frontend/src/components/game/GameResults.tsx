import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Trophy } from "lucide-react";
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
  const currentPlayer = finalLeaderboard.find(
    (entry) => entry.playerId === myPlayerId,
  );

  function handleExit() {
    navigate("/dashboard");
  }

  const content = (
    <>
      <section className="rounded-[var(--radius-panel)] border border-warning/40 bg-accent-yellow/20 p-8 shadow-card sm:p-10">
        <Trophy
          className="mx-auto mb-4 size-9 text-warning"
          strokeWidth={2}
          aria-hidden="true"
        />
        <h1 className="text-balance font-display text-3xl font-bold text-ink">
          {isWinner ? "You won" : "Game finished"}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          Winner: <strong className="font-display text-ink">{winner.username}</strong>,{" "}
          <span className="font-mono font-semibold tabular-nums text-ink">
            {winner.score} pts
          </span>
        </p>
        {currentPlayer && (
          <div className="mx-auto mt-7 grid max-w-sm grid-cols-2 gap-6 border-t border-warning/30 pt-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Your rank</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">
                #{currentPlayer.rank}
              </p>
            </div>
            <div className="border-l border-warning/30 pl-6">
              <p className="text-sm font-semibold text-muted-foreground">Your score</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">
                {currentPlayer.score}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">pts</p>
            </div>
          </div>
        )}
      </section>

      <Leaderboard entries={finalLeaderboard} highlightPlayerId={myPlayerId} />

      <Button onClick={handleExit} className="min-h-12 w-full">
        Return home
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
