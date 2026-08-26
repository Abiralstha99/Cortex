import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
    <div
      role="timer"
      aria-label={`${remaining} seconds remaining`}
      className={cn(
        "relative size-16 shrink-0 rounded-full bg-surface shadow-sm",
        isUrgent && "bg-danger-soft",
      )}
    >
        <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className={isUrgent ? "text-danger/20" : "text-candy-sky/30"}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (1 - progress / 100)}`}
            className={isUrgent ? "text-danger" : "text-candy-sky"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono text-base font-semibold tabular-nums",
              isUrgent ? "text-danger" : "text-ink",
            )}
          >
            {remaining}
          </span>
        </div>
    </div>
  );
}
