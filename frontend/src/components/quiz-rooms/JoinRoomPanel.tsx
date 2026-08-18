import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PublicRoomsList from "@/components/dashboard/PublicRoomsList";
import { Button } from "@/components/ui/button";

export default function JoinRoomPanel() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(value.slice(0, 6));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
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
        <div className="space-y-2">
          <label htmlFor="room-code" className="label-caps text-muted">
            Enter Room Code
          </label>
          <input
            id="room-code"
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="A1B2C3"
            autoComplete="off"
            autoFocus
            maxLength={6}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-2xl font-bold tracking-widest text-center uppercase text-ink placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors"
          />
          {error && (
            <p className="text-sm font-mono text-red-600">{error}</p>
          )}
        </div>

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
