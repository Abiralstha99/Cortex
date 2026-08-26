import { forwardRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

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
      className="scroll-mt-20 bg-cream"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
          From notes to friendly rivalry
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
          One quick path from study material to a room full of players.
        </p>

        <ol className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          {steps.map((step, index) => (
            <li
              key={step.action}
              className="flex flex-1 items-center gap-3 md:min-w-0"
            >
              <div className="min-w-0 flex-1">
                <span className="text-underline-thick font-display text-xl font-extrabold text-ink">
                  {step.action}
                </span>
                <p className="mt-2 text-sm leading-snug text-muted">
                  {step.detail}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <>
                  <ArrowDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-forest md:hidden"
                    strokeWidth={2.5}
                  />
                  <ArrowRight
                    aria-hidden="true"
                    className="hidden size-5 shrink-0 text-forest md:block"
                    strokeWidth={2.5}
                  />
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});
