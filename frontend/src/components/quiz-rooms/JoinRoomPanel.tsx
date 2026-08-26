import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      setError("Room code must be 6 letters or digits");
      return;
    }
    navigate(`/game/lobby/${normalized}`);
  }

  return (
    <div className="space-y-8">
      <nav
        aria-label="Quiz room actions"
        className="flex w-fit gap-1 rounded-full border border-border bg-track p-1"
      >
        <Link
          to="/game/create"
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Create
        </Link>
        <span
          aria-current="page"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Join
        </span>
      </nav>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-(--radius-panel) border border-border bg-surface p-6"
        noValidate
      >
        <RoomCodeInput
          id="room-code"
          value={code}
          onChange={handleChange}
          error={error}
          autoFocus
          label="Enter Room Code"
          className="bg-cream"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={code.length === 0}
        >
          Join room
        </Button>
      </form>

      <div className="space-y-3">
        <p className="label-caps text-muted">Live public rooms</p>
        <PublicRoomsList />
      </div>
    </div>
  );
}
