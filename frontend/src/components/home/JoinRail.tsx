import { useState } from "react";
import { Button } from "@/components/ui/button";
import RoomCodeInput from "@/components/forms/RoomCodeInput";
import { isValidRoomCode, normalizeRoomCode } from "@/components/forms/room-code-utils";

export default function JoinRail({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    setCode(value);
    setError(null);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("Room code must be 6 letters or digits.");
      return;
    }
    onJoin(normalized);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h3 className="text-sm font-semibold text-ink">Join a game</h3>
        <p className="mt-1 text-xs text-muted-foreground">Enter a six-character room code</p>
      </div>

      <RoomCodeInput id="join-rail-code" value={code} onChange={handleChange} error={error} />

      <Button type="submit" className="w-full" disabled={code.length === 0}>
        Join
      </Button>
    </form>
  );
}

