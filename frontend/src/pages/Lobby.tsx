import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut, Play, Copy, Wifi, WifiOff, Crown, Check, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import QuizGenerationPanel from "@/components/lobby/QuizGenerationPanel";
import { useLobbySocket } from "@/hooks/useLobbySocket";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { LobbyPlayer } from "@/lib/api";

export default function Lobby() {
  const { roomCode = "" } = useParams();
  const normalized = roomCode.toUpperCase();
  const navigate = useNavigate();
  const { connected, toggleReady, startGame, leave } = useLobbySocket(normalized);

  const players = useLobbyStore((s) => s.players);
  const hostId = useLobbyStore((s) => s.hostId);
  const gameId = useLobbyStore((s) => s.gameId);
  const numberOfRounds = useLobbyStore((s) => s.numberOfRounds);
  const maxPlayers = useLobbyStore((s) => s.maxPlayers);
  const quizId = useLobbyStore((s) => s.quizId);
  const quizGenStatus = useLobbyStore((s) => s.quizGenStatus);
  const status = useLobbyStore((s) => s.status);
  const toast = useLobbyStore((s) => s.toast);
  const attemptStart = useLobbyStore((s) => s.attemptStart);
  const setToast = useLobbyStore((s) => s.setToast);

  const { id: myUserId } = useCurrentUser();
  const isHost = myUserId != null && hostId === myUserId;
  const quizReady = quizGenStatus === "ready" && Boolean(quizId);

  // Navigate everyone to the game screen when the server confirms game_started
  useEffect(() => {
    if (status === "started" && gameId) {
      navigate(`/game/${gameId}`, { replace: true });
    }
  }, [status, gameId, navigate]);

  // When the host clicks Start, validate locally then emit to the server
  function handleStart() {
    if (attemptStart()) {
      startGame();
    }
  }

  function handleLeave() {
    leave();
    navigate("/dashboard");
  }

  function copyCode() {
    navigator.clipboard.writeText(normalized);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Header section */}
        <div className="mb-8 text-center">
          <p className="label-caps text-muted mb-2">WAITING ROOM</p>
          <h1 className="text-2xl font-semibold text-ink mb-4">Lobby</h1>

          {/* Room code */}
          <div className="inline-flex items-center gap-3 rounded-xl bg-surface border border-border px-6 py-3">
            <span className="label-caps text-muted">ROOM</span>
            <span className="font-mono text-2xl font-bold tracking-widest text-ink">
              {normalized || "------"}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="text-muted hover:text-ink transition-colors"
              aria-label="Copy room code"
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Meta info */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
            {numberOfRounds != null && (
              <span className="font-mono">{numberOfRounds} questions</span>
            )}
            {maxPlayers != null && (
              <span className="font-mono">
                {players.length}/{maxPlayers} players
              </span>
            )}
            <span className={`flex items-center gap-1 ${connected ? "text-code" : "text-rose"}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Status messages */}
        {status === "joining" && (
          <p className="text-center text-sm text-muted mb-6">Joining room…</p>
        )}
        {status === "error" && (
          <p className="text-center text-sm text-rose mb-6">Failed to join room.</p>
        )}

        <QuizGenerationPanel isHost={isHost} />

        {/* Player list */}
        <div className="space-y-2 mb-8">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isHost={player.id === hostId}
              isSelf={player.id === myUserId}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={toggleReady}>
            Toggle ready
          </Button>

          {isHost && (
            <Button
              variant="rose"
              onClick={handleStart}
              disabled={status === "starting" || !quizReady}
              title={!quizReady ? "Wait for the quiz to finish generating" : undefined}
            >
              <Play size={14} className="mr-1" />
              {status === "starting" ? "Starting…" : "Start game"}
            </Button>
          )}

          <Button variant="ghost" onClick={handleLeave} className="text-muted">
            <LogOut size={14} className="mr-1" />
            Leave
          </Button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="mt-4 mx-auto max-w-sm rounded-lg bg-surface border border-border px-4 py-2 text-center text-sm text-ink cursor-pointer"
            onClick={() => setToast(null)}
          >
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

/** Inline player row — replaces the old PlayerCard import */
function PlayerRow({
  player,
  isHost,
  isSelf,
}: {
  player: LobbyPlayer;
  isHost: boolean;
  isSelf: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        isSelf ? "border-rose/30 bg-pastel-blush" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">
          {player.username}
          {isSelf && <span className="ml-1 text-xs text-muted">(you)</span>}
        </span>
        {isHost && (
          <span className="inline-flex items-center gap-0.5 rounded bg-pastel-cream px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
            <Crown size={10} /> Host
          </span>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          player.ready ? "text-code" : "text-muted"
        }`}
      >
        {player.ready ? <Check size={12} /> : <X size={12} />}
        {player.ready ? "Ready" : "Not ready"}
      </span>
    </div>
  );
}
