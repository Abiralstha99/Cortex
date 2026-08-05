import { useEffect, useState } from "react";
import "./Countdown.css";

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
    <div className="countdown">
      <h2 className="countdown__heading">GET READY!</h2>
      <div className="countdown__number">{remaining}</div>
      <p className="countdown__text">Game starting...</p>
    </div>
  );
}
