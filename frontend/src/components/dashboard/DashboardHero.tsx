import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DashboardHero({
  firstName,
}: {
  firstName?: string | null;
}) {
  const navigate = useNavigate();
  const greeting = firstName ? `Welcome back, ${firstName}.` : "Ready when you are.";

  return (
    <section
      className="relative isolate min-h-72 overflow-hidden rounded-[var(--radius-hero)] bg-ink px-6 py-8 text-white shadow-card sm:px-10 sm:py-10"
      aria-labelledby="dashboard-hero-heading"
    >
      <div className="relative z-10 flex h-full max-w-xl flex-col justify-center">
        <p className="text-xs font-semibold tracking-widest text-accent-yellow">
          READY TO PLAY?
        </p>
        <h1
          id="dashboard-hero-heading"
          className="mt-3 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Challenge your friends. Own the leaderboard.
        </h1>
        <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-white/75 sm:text-base">
          {greeting} Join a live room or host your own quiz in seconds.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="active:translate-y-px"
            onClick={() => navigate("/game/join")}
          >
            Join game
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/35 bg-white text-ink hover:bg-white/90 active:translate-y-px"
            onClick={() => navigate("/game/create")}
          >
            Host game
          </Button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 items-center justify-center lg:flex"
        aria-hidden="true"
      >
        <span className="absolute right-12 top-10 grid size-24 place-items-center rounded-[var(--radius-panel)] border border-white/20 bg-white/10 font-display text-6xl font-bold text-accent-yellow">
          ?
        </span>
        <span className="absolute bottom-9 right-36 grid size-28 place-items-center rounded-full border border-white/20 bg-primary-hover/50 text-white">
          <Trophy className="size-12" strokeWidth={2} />
        </span>
        <span className="absolute right-4 top-1/2 size-10 rounded-[var(--radius-control)] border border-white/20 bg-accent-cyan/40" />
      </div>
    </section>
  );
}
