import { Sparkles, Trophy, UsersRound } from "lucide-react";

import { StickerCard } from "@/components/brand/StickerCard";

const features = [
  {
    heading: "Notes become questions",
    description:
      "Upload your material and let AI shape it into a quiz worth playing.",
    tone: "sky",
    icon: Sparkles,
  },
  {
    heading: "Everyone plays live",
    description:
      "Share one room code, bring your friends in, and answer together in real time.",
    tone: "yellow",
    icon: UsersRound,
  },
  {
    heading: "Fast answers win",
    description:
      "Correct answers earn points by placement, so knowing it first matters.",
    tone: "pink",
    icon: Trophy,
  },
] as const;

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <h2 className="font-display max-w-xl text-3xl font-bold tracking-tight text-ink md:text-5xl">
        Study sessions that feel like game night
      </h2>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
        Bring the notes. Cortex handles the questions, room, and race.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-[1.16fr_0.84fr] md:grid-rows-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <StickerCard
              key={feature.heading}
              title={feature.heading}
              subtitle={feature.description}
              tone={feature.tone}
              icon={<Icon className="size-6" strokeWidth={2.25} />}
              className={`w-full px-6 py-7 ${
                index === 0
                  ? "md:row-span-2 md:min-h-96 md:px-10"
                  : "md:min-h-44"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
