import { useState } from "react";
import { Button } from "@/components/ui/button";
import RoomCodeInput from "@/components/forms/RoomCodeInput";
import { isValidRoomCode } from "@/components/forms/room-code-utils";

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
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
      <p className="mb-4 text-sm text-muted">
        Notes to live quiz
      </p>

      <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
        Turn your notes into a live{" "}
        <span className="text-rose">quiz.</span>
      </h1>

      <p className="mb-8 max-w-lg text-lg text-muted">
        Upload any document, generate AI-powered questions, and challenge your
        friends in real-time multiplayer rounds.
      </p>

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

      <form
        onSubmit={handleJoin}
        className="flex flex-wrap items-center gap-3"
        noValidate
      >
        <RoomCodeInput
          id="hero-room-code"
          value={code}
          onChange={handleChange}
          error={error}
          label="Have a code?"
          className="h-10 w-32 text-lg"
        />
        <Button type="submit" variant="default" size="default">
          Join room
        </Button>
      </form>
    </section>
  );
}
