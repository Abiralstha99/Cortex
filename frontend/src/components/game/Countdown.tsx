import { useEffect, useState } from "react";

type CountdownProps = {
  countdownMs: number;
};

export default function Countdown({ countdownMs }: CountdownProps) {
  const [remaining, setRemaining] = useState(Math.ceil(countdownMs / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-2xl font-semibold text-ink mb-4">Get ready</h2>
      <div className="font-mono text-7xl font-bold text-ink">{remaining}</div>
      <p className="mt-4 text-muted">Game starting...</p>
    </div>
  );
}
