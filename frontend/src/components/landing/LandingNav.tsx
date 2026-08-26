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
    <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm transition-shadow duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <BrandMark to="/" />

        {/* Center nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            onClick={(e) => smoothScrollTo(e, "#features")}
            className="text-sm font-medium text-ink/70 transition-colors duration-200 hover:text-ink"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              onHowItWorksClick(e);
            }}
            className="text-sm font-medium text-ink/70 transition-colors duration-200 hover:text-ink"
          >
            How it works
          </a>
          <a
            href="#coverage"
            onClick={(e) => smoothScrollTo(e, "#coverage")}
            className="text-sm font-medium text-ink/70 transition-colors duration-200 hover:text-ink"
          >
            Coverage
          </a>
        </nav>

        {/* CTA pill button */}
        <button
          onClick={onPlayNow}
          className="inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white py-2 pl-3 pr-5 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-ink/20 hover:shadow-md"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-forest text-white">
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </span>
          Start a quiz
        </button>
      </div>
    </header>
  );
}
