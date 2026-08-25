import { useEffect, useState } from "react";

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
  const circumference = 2 * Math.PI * 45;

  const isUrgent = remaining <= 5;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-border"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
            className={isUrgent ? "text-danger" : "text-data"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-2xl font-bold ${isUrgent ? "text-danger" : "text-ink"}`}>
            {remaining}s
          </span>
        </div>
      </div>
    </div>
  );
}
