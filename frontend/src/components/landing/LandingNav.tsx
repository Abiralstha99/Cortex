import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/BrandMark";

interface LandingNavProps {
  onPlayNow: () => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
}

export function LandingNav({ onPlayNow, onHowItWorksClick }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <BrandMark to="/" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          <a
            href="#how-it-works"
            onClick={onHowItWorksClick}
            className="label-caps hidden text-muted transition-colors hover:text-ink sm:inline"
          >
            How it works
          </a>
          <Button variant="rose" size="sm" onClick={onPlayNow}>
            Create quiz
          </Button>
        </div>
      </div>
    </header>
  );
}
