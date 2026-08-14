import { useState } from "react";
import { Button } from "@/components/ui/button";

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

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
    const normalized = code.trim().toUpperCase();
    if (!ROOM_CODE_PATTERN.test(normalized)) {
      setError("Enter the 6-character code exactly as shown to your host.");
      return;
    }
    setError(null);
    onJoinRoom(normalized);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      {/* Eyebrow */}
      <p className="label-caps mb-4 text-muted">
        NOTES → QUIZ → COMPETE
      </p>

      {/* Headline */}
      <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
        Turn your notes into a live{" "}
        <span className="text-rose">quiz.</span>
      </h1>

      {/* Subtitle */}
      <p className="mb-8 max-w-lg text-lg text-muted">
        Upload any document, generate AI-powered questions, and challenge your
        friends in real-time multiplayer rounds.
      </p>

      {/* CTAs */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <Button variant="rose" size="lg" onClick={onCreateQuiz}>
          Create quiz
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#how-it-works" onClick={onHowItWorksClick}>
            How it works
          </a>
        </Button>
      </div>

      {/* Inline room code join */}
      <form
        onSubmit={handleJoin}
        className="flex flex-wrap items-center gap-3"
        noValidate
      >
        <label htmlFor="hero-room-code" className="label-caps text-muted">
          Have a code?
        </label>
        <input
          id="hero-room-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          placeholder="ABC123"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            if (error) setError(null);
          }}
          className="h-10 w-32 rounded-md border border-border bg-surface px-3 text-center font-mono text-lg font-semibold tracking-[0.25em] text-ink placeholder:text-muted/50 focus:border-rose focus:outline-none"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "hero-room-error" : undefined}
        />
        <Button type="submit" variant="default" size="default">
          Join room
        </Button>
        {error && (
          <p
            id="hero-room-error"
            className="w-full text-sm text-rose"
            role="alert"
          >
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
