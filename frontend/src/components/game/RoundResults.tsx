import type { RoundFinishedPayload } from "../../lib/api";
import Leaderboard from "./Leaderboard";
import "./RoundResults.css";

type RoundResultsProps = {
  roundResults: RoundFinishedPayload;
  myPlayerId: string;
};

export default function RoundResults({ roundResults, myPlayerId }: RoundResultsProps) {
  const { roundNumber, correctAnswer, submissions, leaderboard, isLastRound, nextRoundIn } = roundResults;

  return (
    <div className="round-results">
      <div className="round-results__header">
        <h2 className="round-results__title">
          Round {roundNumber} Complete
        </h2>
        <p className="round-results__correct">
          Correct Answer: <strong>{correctAnswer}</strong>
        </p>
      </div>

      <div className="round-results__submissions">
        <h3 className="round-results__subtitle">Submissions</h3>
        {submissions.map((sub) => {
          const player = leaderboard.find((p) => p.playerId === sub.playerId);
          return (
            <div
              key={sub.playerId}
              className={`round-results__submission ${
                sub.playerId === myPlayerId ? "round-results__submission--me" : ""
              }`}
            >
              <span className="round-results__player">{player?.username ?? "Unknown"}</span>
              <span className={`round-results__status ${sub.correct ? "round-results__status--correct" : "round-results__status--wrong"}`}>
                {sub.correct ? "✓" : "✗"}
              </span>
              <span className="round-results__points">+{sub.pointsEarned}</span>
              {sub.placement && (
                <span className="round-results__placement">
                  {sub.placement === 1 ? "1st" : sub.placement === 2 ? "2nd" : sub.placement === 3 ? "3rd" : `${sub.placement}th`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Leaderboard entries={leaderboard} highlightPlayerId={myPlayerId} />

      {!isLastRound && (
        <p className="round-results__next">
          Next round in {Math.ceil(nextRoundIn / 1000)}s...
        </p>
      )}
    </div>
  );
}
