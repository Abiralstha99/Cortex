import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PublicRoomsList from "@/components/dashboard/PublicRoomsList";
import { Button } from "@/components/ui/button";
import RoomCodeInput from "@/components/forms/RoomCodeInput";
import { isValidRoomCode } from "@/components/forms/room-code-utils";

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
    if (!isValidRoomCode(code)) {
      setError("Room code must be 6 letters or digits");
      return;
    }
    navigate(`/game/lobby/${code}`);
  }

  return (
    <div className="space-y-8">
      {/* Create / Join tab links */}
      <nav className="flex gap-1 rounded-lg bg-surface border border-border p-1 w-fit">
        <Link
          to="/game/create"
          className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Create
        </Link>
        <span className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
          Join
        </span>
      </nav>

      {/* Room code form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <RoomCodeInput
          id="room-code"
          value={code}
          onChange={handleChange}
          error={error}
          autoFocus
          label="Enter Room Code"
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
        <p className="label-caps text-muted">Live Public Rooms</p>
        <PublicRoomsList />
      </div>
    </div>
  );
}
