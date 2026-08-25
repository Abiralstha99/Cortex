const steps = [
  "Get the room code from your host",
  "Enter the 6-character code above",
  "You will join the lobby and wait for the game to start",
];

export default function HowJoiningWorks() {
  return (
    <div className="sticky top-24 rounded-[var(--radius-panel)] bg-preview p-6 text-white">
      <p className="text-xs font-medium text-white/60">
        How joining works
      </p>

      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step} className="text-sm text-white/80">
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
