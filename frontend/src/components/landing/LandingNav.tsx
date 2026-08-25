import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingNavProps {
  onPlayNow: () => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
}

export function LandingNav({ onPlayNow, onHowItWorksClick }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <div className="flex items-center gap-1.5">
          <Zap className="size-5 fill-rose text-rose" />
          <span className="text-lg font-bold tracking-tight text-ink">
            Cortex
          </span>
        </div>

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
            Play now
          </Button>
        </div>
      </div>
    </header>
  );
}
