import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FinalCtaProps {
  onStart: () => void;
}

export function FinalCta({ onStart }: FinalCtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="relative overflow-hidden rounded-sticker border-[6px] border-white bg-candy-pink px-6 py-14 text-center shadow-[0_12px_0_0_rgb(0_0_0/0.12)] sm:px-12 md:py-20">
        <div
          aria-hidden="true"
          className="absolute -left-8 -top-10 size-28 rounded-full border-16 border-candy-yellow"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 -right-6 size-32 rounded-full border-18 border-candy-sky"
        />

        <h2 className="relative font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-6xl">
          Make tonight&apos;s quiz
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-ink/75">
          Turn what you know into the game everyone wants to replay.
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={onStart}
          className="relative mt-8 pl-6 pr-2"
        >
          Create quiz
          <span className="flex size-8 items-center justify-center rounded-full bg-candy-yellow text-ink">
            <ArrowUpRight aria-hidden="true" />
          </span>
        </Button>
      </div>
    </section>
  );
}
