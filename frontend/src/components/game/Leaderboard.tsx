import type { LeaderboardEntry } from "../../lib/api";
import "./Leaderboard.css";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightPlayerId?: string | null;
};

export default function Leaderboard({ entries, highlightPlayerId }: LeaderboardProps) {
  return (
    <div className="leaderboard">
      <h3 className="leaderboard__title">LEADERBOARD</h3>
      <div className="leaderboard__table">
        {entries.map((entry) => (
          <div
            key={entry.playerId}
            className={`leaderboard__row ${
              entry.playerId === highlightPlayerId ? "leaderboard__row--highlight" : ""
            }`}
          >
            <div className="leaderboard__rank">{entry.rank}</div>
            <div className="leaderboard__username">{entry.username}</div>
            <div className="leaderboard__score">{entry.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
