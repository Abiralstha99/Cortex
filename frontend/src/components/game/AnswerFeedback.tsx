import type { AnswerResult } from "@/lib/api";

type AnswerFeedbackProps = {
  result: AnswerResult;
};

export default function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const placementText = result.placement
    ? result.placement === 1
      ? "1st"
      : result.placement === 2
      ? "2nd"
      : result.placement === 3
      ? "3rd"
      : `${result.placement}th`
    : null;

  return (
    <div
      className={`rounded-[var(--radius-panel)] border p-6 text-center ${
        result.correct
          ? "bg-success-soft border-success"
          : "bg-danger-soft border-danger"
      }`}
    >
      <div className="text-lg font-semibold text-ink mb-2">
        {result.correct ? "Correct" : "Wrong"}
      </div>
      <div className="font-mono text-2xl font-bold text-ink mb-2">
        +{result.pointsEarned} points
      </div>
      {placementText && (
        <div className="font-mono text-muted mb-2">{placementText}</div>
      )}
      <div className="text-ink">
        Correct answer: <strong>{result.correctAnswer}</strong>
      </div>
      <p className="mt-4 text-sm text-muted">Waiting for other players...</p>
    </div>
  );
}
