import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicRoomsList from "@/components/dashboard/PublicRoomsList";
import { Button } from "@/components/ui/button";
import RoomCodeInput from "@/components/forms/RoomCodeInput";
import {
  isValidRoomCode,
  normalizeRoomCode,
} from "@/components/forms/room-code-utils";

export default function JoinRoomPanel() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    setCode(value);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("Room code must be 6 letters or digits.");
      return;
    }
    navigate(`/game/lobby/${normalized}`);
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-card sm:p-8"
        noValidate
      >
        <div>
          <h2 className="text-base font-semibold leading-[22px] text-ink">Enter your code</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Room codes contain six letters or digits.
          </p>
        </div>
        <RoomCodeInput
          id="room-code"
          value={code}
          onChange={handleChange}
          error={error}
          autoFocus
          label="Room code"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={code.length === 0}
        >
          Join game
        </Button>
      </form>

      <section aria-labelledby="public-rooms-heading" className="space-y-4">
        <div>
          <h2
            id="public-rooms-heading"
            className="text-base font-semibold leading-[22px] text-ink"
          >
            Live public rooms
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Join a room that is open to everyone.
          </p>
        </div>
        <PublicRoomsList hideEmptyState />
      </section>
    </div>
  );
}
