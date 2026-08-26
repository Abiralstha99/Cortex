import { useState } from "react";
import { ArrowUpRight, Crown, LogIn, Trophy } from "lucide-react";

import { EmphasisPill } from "@/components/brand/EmphasisPill";
import { StickerCard } from "@/components/brand/StickerCard";
import { Button } from "@/components/ui/button";
import RoomCodeInput from "@/components/forms/RoomCodeInput";
import {
  isValidRoomCode,
  normalizeRoomCode,
} from "@/components/forms/room-code-utils";

interface HeroProps {
  onCreateQuiz: () => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
  onJoinRoom: (code: string) => void;
}

export function Hero({ onCreateQuiz, onHowItWorksClick, onJoinRoom }: HeroProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("Enter the 6-character code exactly as shown to your host.");
      return;
    }
    setError(null);
    onJoinRoom(normalized);
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (error) setError(null);
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
      <div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl">
          Turn notes into a{" "}
          <EmphasisPill tone="gloss">live quiz</EmphasisPill>{" "}
          <span className="text-underline-thick">with friends</span>
        </h1>

        <p className="mt-5 max-w-md text-base text-muted">
          Upload your notes, generate questions, and race through rounds
          together.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="candy"
            size="lg"
            onClick={onCreateQuiz}
            className="pl-6 pr-2"
          >
            Create quiz
            <span className="flex size-8 items-center justify-center rounded-full bg-ink text-white">
              <ArrowUpRight aria-hidden="true" />
            </span>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#how-it-works" onClick={onHowItWorksClick}>
              How it works
            </a>
          </Button>
        </div>

        <form
          onSubmit={handleJoin}
          className="mt-8 flex flex-wrap items-end gap-3"
          noValidate
        >
          <RoomCodeInput
            id="hero-room-code"
            value={code}
            onChange={handleChange}
            error={error}
            label="Have a code?"
            className="w-40 bg-surface text-lg"
          />
          <Button type="submit" size="lg">
            Join room
          </Button>
        </form>
      </div>

      <div
        className="relative flex min-h-72 items-center justify-center md:min-h-80"
        aria-label="Host, join, and compete"
      >
        <StickerCard
          title="Host"
          tone="sky"
          rotate={-8}
          className="absolute left-2 top-4"
          icon={<Crown className="size-14" strokeWidth={2.25} />}
        />
        <StickerCard
          title="Join"
          tone="yellow"
          rotate={6}
          className="absolute right-2 top-16"
          icon={<LogIn className="size-14" strokeWidth={2.25} />}
        />
        <StickerCard
          title="Compete"
          tone="pink"
          rotate={-3}
          className="absolute bottom-2 left-12 sm:left-20 md:left-12 lg:left-20"
          icon={<Trophy className="size-14" strokeWidth={2.25} />}
        />
      </div>
    </section>
  );
}
