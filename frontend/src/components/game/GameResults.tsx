import { useNavigate } from "react-router-dom";
import type { GameFinishedPayload } from "../../lib/api";
import Leaderboard from "./Leaderboard";
import "./GameResults.css";

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
    <div className="game-results">
      <div className="game-results__header">
        <h2 className="game-results__title">GAME FINISHED!</h2>
        {isWinner ? (
          <p className="game-results__winner game-results__winner--me">
            🎉 YOU WON! 🎉
          </p>
        ) : (
          <p className="game-results__winner">
            Winner: <strong>{winner.username}</strong> ({winner.score} pts)
          </p>
        )}
      </div>

      <Leaderboard entries={finalLeaderboard} highlightPlayerId={myPlayerId} />

      <button
        type="button"
        className="game-results__exit-btn"
        onClick={handleExit}
      >
        BACK TO DASHBOARD
      </button>
    </div>
  );
}
