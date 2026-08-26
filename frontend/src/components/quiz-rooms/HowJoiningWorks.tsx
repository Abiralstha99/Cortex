const steps = [
  "Ask your host for the room code.",
  "Enter the six letters or numbers.",
  "Join the lobby and get ready to play.",
];

export default function HowJoiningWorks() {
  return (
    <aside className="gloss-sheen sticky top-24 rounded-(--radius-panel) border border-white/10 bg-gloss p-6 text-white shadow-[0_8px_0_0_rgb(18_18_18/0.16)]">
      <p className="font-mono text-xs font-semibold text-candy-yellow">
        How joining works
      </p>

      <ul className="mt-5 space-y-4">
        {steps.map((step) => (
          <li
            key={step}
            className="border-b border-white/10 pb-4 text-sm leading-relaxed text-white/80 last:border-0 last:pb-0"
          >
            {step}
          </li>
        ))}
      </ul>
    </aside>
  );
}
