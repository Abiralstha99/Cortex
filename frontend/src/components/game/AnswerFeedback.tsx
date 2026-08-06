import type { AnswerResult } from "../../lib/api";
import "./AnswerFeedback.css";

type AnswerFeedbackProps = {
  result: AnswerResult;
};

export default function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const placementText = result.placement
    ? result.placement === 1
      ? "1st!"
      : result.placement === 2
      ? "2nd!"
      : result.placement === 3
      ? "3rd!"
      : `${result.placement}th`
    : null;

  return (
    <div className={`answer-feedback ${result.correct ? "answer-feedback--correct" : "answer-feedback--wrong"}`}>
      <div className="answer-feedback__status">
        {result.correct ? "✓ CORRECT" : "✗ WRONG"}
      </div>
      <div className="answer-feedback__points">
        +{result.pointsEarned} points
      </div>
      {placementText && (
        <div className="answer-feedback__placement">{placementText}</div>
      )}
      <div className="answer-feedback__answer">
        Correct answer: <strong>{result.correctAnswer}</strong>
      </div>
      <p className="answer-feedback__wait">Waiting for other players...</p>
    </div>
  );
}
