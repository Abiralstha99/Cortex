import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, Copy, LogOut, Play, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import PlayerCard from "@/components/lobby/PlayerCard";
import QuizGenerationPanel from "@/components/lobby/QuizGenerationPanel";
import { useLobbySocket } from "@/hooks/useLobbySocket";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const storeToast = useLobbyStore((s) => s.toast);
  const attemptStart = useLobbyStore((s) => s.attemptStart);
  const setToast = useLobbyStore((s) => s.setToast);

  const { id: myUserId } = useCurrentUser();
  const isHost = myUserId != null && hostId === myUserId;
  const quizReady = quizGenStatus === "ready" && Boolean(quizId);
  const currentPlayer = players.find((player) => player.id === myUserId);
  const allPlayersReady =
    players.length >= 2 && players.every((player) => player.ready);
  const canStart = quizReady && allPlayersReady && status !== "starting";

  useEffect(() => {
    if (!storeToast) return;

    toast(storeToast);
    setToast(null);
  }, [storeToast, setToast]);

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

  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(normalized);
      } else {
        // Fallback for non-HTTPS / insecure contexts (e.g. localhost HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = normalized;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the room code:", normalized);
    }
  }

  return (
    <PageShell maxWidth="3xl">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Game lobby
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="rounded-[var(--radius-card)] border border-border bg-surface px-5 py-3 font-mono text-2xl font-semibold tracking-widest text-ink sm:text-3xl">
            {normalized || "------"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyCode}
            aria-label={copied ? "Copied room code" : "Copy room code"}
          >
            {copied ? <Check className="text-success" /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              connected
                ? "text-success-foreground"
                : "text-danger-foreground"
            }`}
            role="status"
          >
            {connected ? <Wifi className="size-4" aria-hidden="true" /> : <WifiOff className="size-4" aria-hidden="true" />}
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {numberOfRounds != null && (
            <span className="font-mono">{numberOfRounds} questions</span>
          )}
          {maxPlayers != null && (
            <span className="font-mono">
              {players.length}/{maxPlayers} players
            </span>
          )}
        </div>
      </header>

      {status === "joining" && (
        <p className="mb-6 text-sm text-muted-foreground" role="status">Joining room...</p>
      )}
      {status === "error" && (
        <p className="mb-6 text-sm text-danger-foreground" role="alert">Failed to join room.</p>
      )}

      <QuizGenerationPanel isHost={isHost} />

      <section className="mb-10" aria-labelledby="players-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="players-heading" className="text-xl font-bold text-ink">
            Players
          </h2>
          <p className="text-sm text-muted-foreground">
            {players.length === 1 ? "Waiting for players" : `${players.length} players joined`}
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-live="polite">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.id === hostId}
              isSelf={player.id === myUserId}
            />
          ))}
        </ul>
      </section>

      {isHost && (
        <section
          className="mb-6 rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-card sm:p-6"
          aria-labelledby="start-game-heading"
        >
          <h2 id="start-game-heading" className="text-lg font-bold text-ink">
            Start the game
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start when the quiz is ready and every player is ready.
          </p>
          <Button
            variant="default"
            onClick={handleStart}
            disabled={!canStart}
            title={!canStart ? "Wait for the quiz and all players to be ready" : undefined}
            className="mt-4"
          >
            <Play className="size-4" aria-hidden="true" />
            {status === "starting" ? "Starting..." : "Start game"}
          </Button>
        </section>
      )}

      <section className="mb-6 border-l-4 border-primary pl-5" aria-labelledby="readiness-heading">
        <h2 id="readiness-heading" className="text-lg font-bold text-ink">
          Your readiness
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentPlayer?.ready
            ? "You are ready to play."
            : "Mark ready when you are set to play."}
        </p>
        <Button variant="outline" onClick={toggleReady} className="mt-4">
          {currentPlayer?.ready ? "Mark not ready" : "I'm ready"}
        </Button>
      </section>

      <Button variant="ghost" onClick={handleLeave} className="text-muted-foreground">
        <LogOut className="size-4" aria-hidden="true" />
        Leave lobby
      </Button>
    </PageShell>
  );
}
