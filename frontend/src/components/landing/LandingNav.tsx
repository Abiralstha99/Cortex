import { BrandMark } from "@/components/brand/BrandMark";
import { ArrowRight } from "lucide-react";

interface LandingNavProps {
  onPlayNow: () => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
}

function smoothScrollTo(e: React.MouseEvent, selector: string) {
  e.preventDefault();
  const el = document.querySelector(selector);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingNav({ onPlayNow, onHowItWorksClick }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 transition-shadow duration-300 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark
          to="/"
          className="inline-flex min-h-11 items-center rounded-control outline-none focus-visible:ring-3 focus-visible:ring-primary/30"
        />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            onClick={(e) => smoothScrollTo(e, "#features")}
            className="flex min-h-11 items-center text-sm font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:text-ink focus-visible:rounded-control focus-visible:ring-3 focus-visible:ring-primary/30"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              onHowItWorksClick(e);
            }}
            className="flex min-h-11 items-center text-sm font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:text-ink focus-visible:rounded-control focus-visible:ring-3 focus-visible:ring-primary/30"
          >
            How it works
          </a>
          <a
            href="#coverage"
            onClick={(e) => smoothScrollTo(e, "#coverage")}
            className="flex min-h-11 items-center text-sm font-semibold text-muted-foreground outline-none transition-colors duration-150 hover:text-ink focus-visible:rounded-control focus-visible:ring-3 focus-visible:ring-primary/30"
          >
            Coverage
          </a>
        </nav>

        <button
          type="button"
          onClick={onPlayNow}
          className="inline-flex h-12 min-w-11 items-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold whitespace-nowrap text-white outline-none transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-primary/30 sm:px-5"
        >
          Create quiz
          <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
        </button>
      </div>
    </header>
  );
}
