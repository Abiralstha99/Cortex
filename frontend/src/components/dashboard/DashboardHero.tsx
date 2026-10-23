import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "motion/react";

export default function DashboardHero({
  firstName,
}: {
  firstName?: string | null;
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const greeting = firstName ? `Welcome back, ${firstName}.` : "Ready when you are.";

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="editorial-dashboard-hero relative isolate overflow-hidden rounded-[var(--radius-hero)] bg-ink px-6 py-8 text-white shadow-card sm:px-10 sm:py-10"
      aria-labelledby="dashboard-hero-heading"
    >
      <div className="relative z-10 flex h-full max-w-xl flex-col justify-center">
        <p className="text-xs font-semibold tracking-widest text-accent-yellow">
          YOUR SPACE
        </p>
        <h1
          id="dashboard-hero-heading"
          className="mt-3 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl"
        >
          Ready for another round?
        </h1>
        <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-white/75 sm:text-base">
          {greeting} Bring your notes, invite your friends, and see who knows their stuff.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="bg-[#fcfaf5] text-[#161410] hover:bg-[#f3eedc] active:translate-y-px"
            onClick={() => navigate("/game/create")}
          >
            Create a quiz
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/45 bg-transparent text-white hover:bg-white/10 active:translate-y-px"
            onClick={() => navigate("/game/join")}
          >
            Join game
          </Button>
          <Button type="button" variant="outline" className="border-white/45 bg-transparent text-white hover:bg-white/10" onClick={() => navigate("/practice")}>Practice solo</Button>
        </div>
      </div>
    </motion.section>
  );
}
