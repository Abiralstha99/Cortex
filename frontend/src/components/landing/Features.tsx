import { Sparkles, Trophy, UsersRound } from "lucide-react";

import { StickerCard } from "@/components/brand/StickerCard";

const features = [
  {
    heading: "Notes become questions",
    description:
      "Upload your material and let AI shape it into a quiz worth playing.",
    tone: "sky",
    rotate: -4,
    icon: Sparkles,
  },
  {
    heading: "Everyone plays live",
    description:
      "Share one room code, bring your friends in, and answer together in real time.",
    tone: "yellow",
    rotate: 3,
    icon: UsersRound,
  },
  {
    heading: "Fast answers win",
    description:
      "Correct answers earn points by placement, so knowing it first matters.",
    tone: "pink",
    rotate: -2,
    icon: Trophy,
  },
] as const;

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
        Study sessions that feel like game night
      </h2>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
        Bring the notes. Cortex handles the questions, room, and race.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-4 lg:px-10">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <StickerCard
              key={feature.heading}
              title={feature.heading}
              subtitle={feature.description}
              tone={feature.tone}
              rotate={feature.rotate}
              icon={<Icon className="size-14" strokeWidth={2.25} />}
              className={`w-full min-h-72 justify-self-center px-6 py-7 md:max-w-72 ${
                index === 1
                  ? "md:translate-y-10"
                  : index === 2
                    ? "md:-translate-y-3"
                    : ""
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
