import { useEffect, useState } from "react";
import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerProps = {
  startedAt: Date;
  timeLimit: number; // milliseconds
};

export default function Timer({ startedAt, timeLimit }: TimerProps) {
  const [elapsed, setElapsed] = useState(() =>
    Math.min(Math.max(Date.now() - startedAt.getTime(), 0), timeLimit),
  );

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
  const remainingProgress = timeLimit > 0 ? (timeLimit - elapsed) / timeLimit : 0;
  const circumference = 2 * Math.PI * 45;

  const isUrgent = remaining <= 5;

  return (
    <div
      role="timer"
      aria-label={`${remaining} ${remaining === 1 ? "second" : "seconds"} remaining`}
      className={cn(
        "flex min-h-20 shrink-0 items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2 shadow-card",
        isUrgent
          ? "border-danger/30 bg-danger-soft"
          : "border-border bg-surface",
      )}
    >
      <div className="relative size-16 shrink-0">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className={isUrgent ? "text-danger/20" : "text-primary-soft"}
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
            strokeDashoffset={`${circumference * (1 - remainingProgress)}`}
            className={isUrgent ? "text-danger" : "text-primary"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              isUrgent ? "text-danger-foreground" : "text-ink",
            )}
          >
            {remaining}
          </span>
        </div>
      </div>
      <div className="min-w-20">
        <p className="text-xs font-semibold text-muted-foreground">
          {remaining === 1 ? "second" : "seconds"}
        </p>
        {isUrgent && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger-foreground">
            <AlarmClock className="size-4" aria-hidden="true" />
            Time running out
          </p>
        )}
      </div>
    </div>
  );
}
