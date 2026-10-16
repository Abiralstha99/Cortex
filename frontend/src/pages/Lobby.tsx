import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import PlayerCard from "@/components/lobby/PlayerCard";
import QuizGenerationPanel from "@/components/lobby/QuizGenerationPanel";
import { useLobbySocket } from "@/hooks/useLobbySocket";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Lobby() {
  const reduceMotion = useReducedMotion();
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
  const startReason =
    quizGenStatus === "failed"
      ? "Retry quiz generation to continue."
      : !quizReady
        ? "Waiting for the quiz to be ready."
        : players.length < 2
          ? "At least 2 players are needed."
          : !allPlayersReady
            ? "Everyone needs to be ready."
            : status === "starting"
              ? "Starting game..."
              : "";

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
    <PageShell maxWidth="5xl" variant="preGame" className="editorial-lobby">
      <motion.header
        className="editorial-lobby-header mb-6 border-b border-border pb-6"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Live room
            </p>
            <h1 className="editorial-lobby-title text-ink">
          Game lobby
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="editorial-lobby-code flex items-center gap-3 px-3 py-2">
              <span className="font-mono text-base font-semibold tracking-[0.18em] text-ink">
                {normalized || "------"}
              </span>
              <Button type="button" variant="ghost" size="xs" onClick={copyCode} aria-label={copied ? "Copied room code" : "Copy room code"}>
                {copied ? <Check className="text-success-foreground" /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2 text-xs font-semibold ${connected ? "text-success-foreground" : "text-danger-foreground"}`} role="status">
              <span className={`size-2 rounded-full ${connected ? "bg-success" : "bg-danger"}`} aria-hidden="true" />
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
          {numberOfRounds != null && <span className="font-mono">{numberOfRounds} questions</span>}
          {maxPlayers != null && <span className="font-mono">{players.length}/{maxPlayers} players</span>}
        </div>
        <QuizGenerationPanel isHost={isHost} />
      </motion.header>

      {status === "joining" && (
        <p className="mb-6 text-sm text-muted-foreground" role="status">Joining room...</p>
      )}
      {status === "error" && (
        <p className="mb-6 text-sm text-danger-foreground" role="alert">Failed to join room.</p>
      )}

      <div className="editorial-players overflow-hidden">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="players-heading" className="font-serif text-3xl font-normal text-ink">
            Players
            </h2>
            <p className="font-mono text-xs text-muted-foreground">{players.length} / {maxPlayers ?? "—"}</p>
          </div>
        </div>
        <ul className="divide-y divide-border" aria-live="polite">
          {players.length === 0 && status !== "joining" && (
            <li className="px-4 py-8 text-sm text-muted-foreground">Waiting for players to join…</li>
          )}
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.id === hostId}
              isSelf={player.id === myUserId}
            />
          ))}
        </ul>
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Button variant={currentPlayer?.ready ? "secondary" : "outline"} onClick={toggleReady}>
              {currentPlayer?.ready ? <Check aria-hidden="true" /> : null}
              {currentPlayer?.ready ? "You're ready" : "I'm ready"}
            </Button>
          </div>
          {isHost && (
            <div className="flex min-w-0 flex-col items-stretch gap-1.5 sm:items-end">
              <Button variant="default" onClick={handleStart} disabled={!canStart} title={!canStart ? startReason : undefined}>
                {status === "starting" ? "Starting..." : "Start game"}
                <ArrowRight aria-hidden="true" />
              </Button>
              {!canStart && <p className="text-right text-xs text-muted-foreground">{startReason}</p>}
            </div>
          )}
          {!isHost && currentPlayer?.ready && (
            <p className="text-sm text-muted-foreground">Waiting for the host to start.</p>
          )}
        </div>
      </div>

      <Button variant="ghost" onClick={handleLeave} className="text-muted-foreground">
        <LogOut className="size-4" aria-hidden="true" />
        Leave lobby
      </Button>
    </PageShell>
  );
}
