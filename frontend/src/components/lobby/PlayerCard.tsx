import { CheckCircle2, Circle, Crown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LobbyPlayer } from "@/lib/api";

type PlayerCardProps = {
  player: LobbyPlayer;
  isHost: boolean;
  isSelf: boolean;
};

export default function PlayerCard({
  player,
  isHost,
  isSelf,
}: PlayerCardProps) {
  const reduceMotion = useReducedMotion();
  const initial = player.username.trim().charAt(0).toUpperCase() || "?";
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary"
          aria-hidden="true"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{player.username}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
            {isSelf && <span className="text-primary">You</span>}
            {isHost && (
              <span className="inline-flex items-center gap-1 text-ink">
                <Crown className="size-3.5 text-accent-yellow" aria-hidden="true" />
                Host
              </span>
            )}
          </div>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${
          player.ready ? "text-success-foreground" : "text-muted-foreground"
        }`}
      >
        {player.ready ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          <Circle className="size-4" aria-hidden="true" />
        )}
        {player.ready ? "Ready" : "Not ready"}
      </span>
    </>
  );

  const className = `flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 ${
    isSelf ? "bg-primary-soft/40" : "bg-surface"
  }`;

  if (reduceMotion) {
    return <li className={className}>{content}</li>;
  }

  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      {content}
    </motion.li>
  );
}
