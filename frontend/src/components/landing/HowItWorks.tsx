import { forwardRef } from "react";

const steps = [
  { num: "01", title: "Upload your notes" },
  { num: "02", title: "AI generates questions" },
  { num: "03", title: "Create a room" },
  { num: "04", title: "Friends join with code" },
  { num: "05", title: "Compete in real-time" },
];

export const HowItWorks = forwardRef<HTMLElement>(function HowItWorks(_, ref) {
  return (
    <section
      id="how-it-works"
      ref={ref}
      className="bg-preview py-20 text-white"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="label-caps mb-3 text-white/60">HOW IT WORKS</p>
        <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
          Five steps to{" "}
          <span className="italic text-rose">rush</span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-white/10 bg-white/[0.07] p-6"
            >
              <span className="mb-3 block font-mono text-2xl font-semibold text-rose">
                {step.num}
              </span>
              <p className="text-sm font-medium leading-snug text-white">
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
