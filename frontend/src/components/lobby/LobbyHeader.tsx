import { Copy, Wifi, WifiOff } from "lucide-react";

type LobbyHeaderProps = {
  roomCode: string | null;
  quizId: string | null;
  numberOfRounds: number | null;
  connected: boolean;
};

export default function LobbyHeader({
  roomCode,
  quizId,
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
        {quizId && (
          <span className="lobby-header__tag">
            QUIZ {quizId.slice(0, 8).toUpperCase()}
          </span>
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
