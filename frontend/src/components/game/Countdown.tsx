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
    <section className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border-4 border-white bg-candy-sky/35 px-6 py-14 text-center shadow-[0_10px_0_0_rgb(0_0_0/0.12)] ring-1 ring-candy-sky">
      <h2 className="mb-6 text-balance font-display text-3xl font-extrabold text-ink">
        Get ready
      </h2>
      {reduce ? (
        <div className="flex size-28 items-center justify-center rounded-full bg-surface font-mono text-6xl font-semibold tabular-nums text-forest shadow-sm">
          {remaining}
        </div>
      ) : (
        <motion.div
          key={remaining}
          initial={{ opacity: 0.35, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="flex size-28 items-center justify-center rounded-full bg-surface font-mono text-6xl font-semibold tabular-nums text-forest shadow-sm"
        >
          {remaining}
        </motion.div>
      )}
      <p className="mt-6 text-pretty font-medium text-muted">Game starting...</p>
    </section>
  );
}
