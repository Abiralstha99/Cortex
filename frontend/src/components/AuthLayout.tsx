import type { ReactNode } from "react";
import { Sparkles, Trophy, UsersRound } from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";

const gameMoments = [
  { label: "Create from notes", icon: Sparkles },
  { label: "Invite the room", icon: UsersRound },
  { label: "Race for first", icon: Trophy },
] as const;

export default function AuthLayout({
  heading,
  subtitle,
  children,
}: {
  heading: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-7xl overflow-hidden rounded-hero border border-border bg-surface shadow-card sm:min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[0.88fr_1.12fr]">
        <section className="relative overflow-hidden bg-ink px-6 py-6 text-white sm:px-10 sm:py-8 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
          <BrandMark
            to="/"
            className="relative inline-flex min-h-11 items-center rounded-control text-white outline-none focus-visible:ring-3 focus-visible:ring-white/35"
          />

          <div className="relative mt-14 hidden max-w-md sm:block lg:my-auto">
            <p className="text-sm font-semibold text-white/70">Live quiz night</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Your notes. Their fastest answers.
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-white/70">
              Create a room, bring everyone in with one code, and race for the
              top spot.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {gameMoments.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm font-semibold"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-control border border-white/15 bg-white/10">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-12 hidden text-sm text-white/55 lg:block">
            Multiplayer study sessions, ready when your group is.
          </p>
        </section>

        <section
          aria-labelledby="auth-task-heading"
          className="flex items-center justify-center bg-surface px-5 py-10 sm:px-10 lg:px-16"
        >
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h1
                id="auth-task-heading"
                className="text-3xl font-bold tracking-tight text-ink sm:text-4xl"
              >
                {heading}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
            </div>

            <div className="w-full">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
