import { Copy, Wifi, WifiOff } from "lucide-react";
import type { Difficulty } from "../../lib/api";

type LobbyHeaderProps = {
  roomCode: string | null;
  difficulty: Difficulty | null;
  numberOfRounds: number | null;
  connected: boolean;
};

export default function LobbyHeader({
  roomCode,
  difficulty,
  numberOfRounds,
  connected,
}: LobbyHeaderProps) {
  function copyCode() {
    if (roomCode) navigator.clipboard.writeText(roomCode);
  }

  return (
    <div className="lobby-header">
      <div className="lobby-header__code-row">
        <span className="lobby-header__label">ROOM</span>
        <span className="lobby-header__code">{roomCode ?? "------"}</span>
        <button
          type="button"
          className="lobby-header__copy"
          onClick={copyCode}
          aria-label="Copy room code"
        >
          <Copy size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="lobby-header__meta">
        {difficulty && (
          <span className="lobby-header__tag">{difficulty.toUpperCase()}</span>
        )}
        {numberOfRounds != null && (
          <span className="lobby-header__tag">{numberOfRounds} ROUNDS</span>
        )}
        <span
          className={`lobby-header__connection ${connected ? "lobby-header__connection--on" : ""}`}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? "CONNECTED" : "DISCONNECTED"}
        </span>
      </div>
    </div>
  );
}
