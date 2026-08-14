const steps = [
  { number: "01", text: "Get the room code from your host" },
  { number: "02", text: "Enter the 6-character code above" },
  { number: "03", text: "You'll join the lobby and wait for the game to start" },
];

export default function HowJoiningWorks() {
  return (
    <div className="sticky top-24 rounded-2xl bg-preview p-6 text-white">
      <p className="text-xs uppercase tracking-wider text-white/60">
        How Joining Works
      </p>

      <div className="mt-6 space-y-5">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <span className="font-mono text-sm font-bold text-data">
              {step.number}
            </span>
            <p className="text-sm text-white/80">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
