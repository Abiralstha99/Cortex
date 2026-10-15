import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import type { ConnectionState } from "@/hooks/useGameSocket";
import { Button } from "@/components/ui/button";

type ConnectionBannerProps = {
  state: ConnectionState;
  onRetry: () => void;
  onExit?: () => void;
};

export default function ConnectionBanner({
  state,
  onRetry,
  onExit,
}: ConnectionBannerProps) {
  if (state === "offline") {
    return (
      <section
        role="alert"
        className="rounded-[var(--radius-panel)] border border-danger/30 bg-danger-soft p-6 text-center shadow-card sm:p-8"
      >
        <WifiOff
          className="mx-auto mb-4 size-8 text-danger"
          strokeWidth={2}
          aria-hidden="true"
        />
        <h1 className="text-balance font-display text-2xl font-bold text-ink">
          We couldn't reconnect you to this game.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
          Check your connection, then try joining the live game again.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          {onExit && <Button type="button" variant="outline" onClick={onExit}>
            Return home
          </Button>}
        </div>
      </section>
    );
  }

  if (state === "connected") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-success/30 bg-success-soft px-4 py-2 text-sm font-semibold text-ink shadow-card"
      >
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        Reconnected.
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-info/30 bg-primary-soft px-4 py-2 text-sm font-semibold text-ink shadow-card"
    >
      <WifiOff className="size-4 text-info" aria-hidden="true" />
      Connection lost. Reconnecting...
    </div>
  );
}
