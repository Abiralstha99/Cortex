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
  const isUrgent = remaining <= 5;
  const progressPercent = Math.round(remainingProgress * 100);

  return (
    <div
      role="timer"
      aria-label={`${remaining} ${remaining === 1 ? "second" : "seconds"} remaining`}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-1.5",
        isUrgent
          ? "border-warning/40 bg-warning/10"
          : "border-border bg-surface",
      )}
    >
      <div
        role="progressbar"
        aria-label="Time remaining"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="h-1.5 w-16 overflow-hidden rounded-full bg-primary-soft sm:w-24"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-150",
            isUrgent ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-lg font-semibold tabular-nums",
          isUrgent ? "text-warning-foreground" : "text-ink",
        )}
      >
        {remaining}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">
        {remaining === 1 ? "second" : "seconds"}
      </span>
      {isUrgent && (
        <span className="hidden items-center gap-1 text-xs font-semibold text-warning-foreground sm:flex">
          <AlarmClock className="size-4" aria-hidden="true" />
          Time running out
        </span>
      )}
    </div>
  );
}
