import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FinalCtaProps {
  onStart: () => void;
}

export function FinalCta({ onStart }: FinalCtaProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 md:pb-24 lg:px-8">
      <div className="rounded-hero bg-primary px-6 py-12 text-center text-white shadow-card sm:px-12 md:py-16">
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          Make tonight&apos;s quiz
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/75">
          Turn what you know into the game everyone wants to replay.
        </p>
        <Button
          size="lg"
          onClick={onStart}
          className="mt-8 bg-white text-primary hover:bg-primary-soft"
        >
          Create quiz
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
