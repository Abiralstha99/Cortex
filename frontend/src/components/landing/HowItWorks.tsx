import { forwardRef } from "react";

const steps = [
  "Upload your notes",
  "AI generates questions",
  "Create a room",
  "Friends join with a code",
  "Compete in real-time",
];

export const HowItWorks = forwardRef<HTMLElement>(function HowItWorks(_, ref) {
  return (
    <section
      id="how-it-works"
      ref={ref}
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <h2 className="mb-8 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        How it <span className="italic text-rose">works</span>
      </h2>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li
            key={step}
            className="flex items-baseline gap-3 border-b border-border pb-3 last:border-0"
          >
            <span className="font-mono text-sm text-muted">{i + 1}</span>
            <span className="text-base font-medium text-ink">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
});
