import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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
  const reduceMotion = useReducedMotion();

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
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-8">
      <div className="grid overflow-hidden rounded-hero bg-ink text-white shadow-floating md:grid-cols-[0.46fr_0.54fr] md:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="px-6 pb-8 pt-9 sm:px-10 sm:pb-10 sm:pt-12 lg:px-12 lg:py-14"
        >
          <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Turn notes into a live quiz with friends
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            Build quiz rounds from your notes, invite the group, and race for
            the top spot.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              onClick={onCreateQuiz}
              className="bg-white text-ink hover:bg-primary-soft"
            >
              Create quiz
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              asChild
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#how-it-works" onClick={onHowItWorksClick}>
                How it works
              </a>
            </Button>
          </div>

          <form
            onSubmit={handleJoin}
            className="mt-8 flex flex-wrap items-end gap-3 border-t border-white/15 pt-6 [&_label]:text-white/75 [&_p[role=alert]]:!text-danger-soft"
            noValidate
          >
            <RoomCodeInput
              id="hero-room-code"
              value={code}
              onChange={handleChange}
              error={error}
              label="Have a code?"
              className="w-40 border-white/15 bg-white text-lg text-ink placeholder:text-muted"
            />
            <Button
              type="submit"
              size="lg"
              className="border border-white/20 bg-primary-hover text-white hover:bg-primary"
            >
              Join room
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: reduceMotion ? 0 : 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative self-stretch md:min-h-[35rem]"
        >
          <img
            src="/assets/landing/cortex-quiz-arena-navy.png"
            alt="A Cortex trophy surrounded by colorful quiz controls"
            width="960"
            height="640"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full object-cover object-[62%_center] md:absolute md:inset-0 md:h-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
