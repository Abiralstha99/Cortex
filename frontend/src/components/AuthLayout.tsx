import type { ReactNode } from "react";
import { Sparkles, Trophy, UsersRound } from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import "@/styles/editorialApp.css";

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
    <main data-theme="editorial-app" className="editorial-app editorial-auth min-h-dvh bg-background p-3 text-ink sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-7xl overflow-hidden rounded-panel border border-border bg-background shadow-floating sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[0.82fr_1fr]">
        <section className="relative overflow-hidden border-b border-border bg-background px-5 py-5 sm:px-8 sm:py-7 lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-12 lg:py-10">
          <BrandMark
            to="/"
            className="relative inline-flex min-h-11 items-center rounded-control text-ink outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          />

          <div className="relative mt-8 max-w-md sm:mt-12 lg:my-auto">
            <p className="text-sm font-semibold text-muted">Live quiz night</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Your notes. Their fastest answers.
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-muted">
              Create a room, bring everyone in with one code, and race for the
              top spot.
            </p>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-3 lg:mt-8 lg:grid-cols-1">
              {gameMoments.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm font-semibold text-ink"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-primary">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-8 hidden text-sm text-text-muted lg:block">
            Multiplayer study sessions, ready when your group is.
          </p>
        </section>

        <section
          aria-labelledby="auth-task-heading"
          className="flex items-center justify-center bg-subtle px-4 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-12"
        >
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h1
                id="auth-task-heading"
                className="text-3xl font-bold tracking-tight text-ink sm:text-4xl"
              >
                {heading}
              </h1>
              <p className="mt-2 text-base text-muted">{subtitle}</p>
            </div>

            <div className="w-full rounded-panel border border-border bg-surface p-5 shadow-floating sm:p-7">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
