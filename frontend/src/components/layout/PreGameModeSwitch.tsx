import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const modes = [
  { label: "Create", href: "/game/create" },
  { label: "Join", href: "/game/join" },
] as const;

export default function PreGameModeSwitch() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Game setup mode"
      className="inline-flex rounded-md border border-border bg-surface p-1"
    >
      {modes.map((mode) => {
        const isActive = pathname === mode.href;

        return (
          <Link
            key={mode.href}
            to={mode.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-[calc(var(--radius-control)-2px)] px-4 py-2 text-sm font-semibold leading-5 text-muted-foreground outline-none transition-[background-color,color,transform] duration-150 hover:bg-surface/80 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0",
              isActive && "bg-primary-soft text-primary",
            )}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}
