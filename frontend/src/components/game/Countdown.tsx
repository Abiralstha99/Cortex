import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

type CountdownProps = {
  countdownMs: number;
};

export default function Countdown({ countdownMs }: CountdownProps) {
  const [remaining, setRemaining] = useState(Math.ceil(countdownMs / 1000));
  const reduce = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-live="polite"
      className="editorial-stage flex min-h-80 flex-col items-center justify-center rounded-[var(--radius-panel)] border border-primary/20 bg-primary-soft px-6 py-14 text-center shadow-card"
    >
      <h1 className="mb-6 text-balance font-display text-3xl font-bold text-ink">
        Get ready
      </h1>
      {reduce ? (
        <div className="flex size-28 items-center justify-center rounded-full border border-primary/20 bg-surface font-mono text-5xl font-semibold tabular-nums text-primary shadow-card">
          {remaining}
        </div>
      ) : (
        <motion.div
          key={remaining}
          initial={{ opacity: 0.35, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="flex size-28 items-center justify-center rounded-full border border-primary/20 bg-surface font-mono text-5xl font-semibold tabular-nums text-primary shadow-card"
        >
          {remaining}
        </motion.div>
      )}
      <p className="mt-6 text-pretty font-medium text-muted-foreground">Game starting...</p>
    </section>
  );
}
