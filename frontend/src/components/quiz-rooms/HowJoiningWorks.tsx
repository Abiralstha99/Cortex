const steps = [
  "Ask your host for the room code.",
  "Enter the six letters or numbers.",
  "Join the lobby and get ready to play.",
];

export default function HowJoiningWorks() {
  return (
    <aside className="rounded-[var(--radius-panel)] bg-primary-soft p-6 xl:sticky xl:top-24">
      <h2 className="text-xl font-bold text-ink">How joining works</h2>
      <ol className="mt-6 space-y-5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface text-sm font-bold text-primary"
            >
              {index + 1}
            </span>
            <p className="pt-2.5 text-sm leading-relaxed text-muted-foreground">{step}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
