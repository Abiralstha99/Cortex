import { forwardRef } from "react";

const steps = [
  { action: "Drop in", detail: "your notes" },
  { action: "Shape", detail: "the quiz with AI" },
  { action: "Open", detail: "a live room" },
  { action: "Invite", detail: "friends by code" },
  { action: "Race", detail: "for the top spot" },
];

export const HowItWorks = forwardRef<HTMLElement>(function HowItWorks(_, ref) {
  return (
    <section
      id="how-it-works"
      ref={ref}
      className="scroll-mt-20 bg-primary-soft/60"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <h2 className="font-display max-w-2xl text-3xl font-bold tracking-tight text-ink md:text-5xl">
          From notes to friendly rivalry
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          One quick path from study material to a room full of players.
        </p>

        <ol className="mt-10 grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => (
            <li
              key={step.action}
              className="relative border-l-2 border-primary/20 py-1 pl-5 md:min-h-40 md:border-l-0 md:border-t md:py-0 md:pl-0 md:pt-5"
            >
              <span className="flex size-10 items-center justify-center rounded-control bg-primary-soft font-mono text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">
                {step.action}
              </h3>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});
