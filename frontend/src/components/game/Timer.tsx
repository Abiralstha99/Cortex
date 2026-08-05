import { useEffect, useState } from "react";
import "./Timer.css";

type TimerProps = {
  startedAt: Date;
  timeLimit: number; // milliseconds
};

export default function Timer({ startedAt, timeLimit }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = startedAt.getTime();
      const elapsedMs = now - start;
      setElapsed(Math.min(elapsedMs, timeLimit));
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, timeLimit]);

  const remaining = Math.max(0, Math.ceil((timeLimit - elapsed) / 1000));
  const progress = (elapsed / timeLimit) * 100;

  return (
    <div className="timer">
      <svg className="timer__circle" viewBox="0 0 100 100">
        <circle
          className="timer__track"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          className="timer__progress"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={remaining <= 5 ? "#ef4444" : "#6366f1"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="timer__text">{remaining}s</div>
    </div>
  );
}
