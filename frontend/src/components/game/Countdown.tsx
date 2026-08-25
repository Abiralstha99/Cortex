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
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-2xl font-semibold text-ink mb-4">Get ready</h2>
      {reduce ? (
        <div className="font-mono text-7xl font-bold text-ink">{remaining}</div>
      ) : (
        <motion.div
          key={remaining}
          initial={{ opacity: 0.4, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="font-mono text-7xl font-bold text-ink"
        >
          {remaining}
        </motion.div>
      )}
      <p className="mt-4 text-muted">Game starting...</p>
    </div>
  );
}
