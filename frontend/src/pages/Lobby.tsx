import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut, Play, Copy, Wifi, WifiOff, Crown, Check, X } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const storeToast = useLobbyStore((s) => s.toast);
  const attemptStart = useLobbyStore((s) => s.attemptStart);
  const setToast = useLobbyStore((s) => s.setToast);

  const { id: myUserId } = useCurrentUser();
  const isHost = myUserId != null && hostId === myUserId;
  const quizReady = quizGenStatus === "ready" && Boolean(quizId);

  // Bridge lobbyStore toast to sonner - ref guards against infinite loops
  const lastToastRef = useRef<string | null>(null);
  useEffect(() => {
    if (storeToast && storeToast !== lastToastRef.current) {
      lastToastRef.current = storeToast;
      toast(storeToast, {
        onAutoClose: () => {
          lastToastRef.current = null;
          setToast(null);
        },
        onDismiss: () => {
          lastToastRef.current = null;
          setToast(null);
        },
      });
    } else if (!storeToast) {
      lastToastRef.current = null;
    }
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
    <PageShell maxWidth="2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-medium text-muted mb-2">Lobby</h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl font-bold tracking-widest text-ink">
            {normalized || "------"}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-md p-1.5 text-muted hover:text-ink hover:bg-track transition-colors"
            aria-label={copied ? "Copied!" : "Copy room code"}
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          {numberOfRounds != null && (
            <span className="font-mono">{numberOfRounds} questions</span>
          )}
          {maxPlayers != null && (
            <span className="font-mono">
              {players.length}/{maxPlayers} players
            </span>
          )}
          <span className={`inline-flex items-center gap-1 ${connected ? "text-success" : "text-danger"}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Status messages */}
      {status === "joining" && (
        <p className="text-sm text-muted mb-6">Joining room...</p>
      )}
      {status === "error" && (
        <p className="text-sm text-danger mb-6">Failed to join room.</p>
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
      <div className="flex flex-wrap items-center gap-3">
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
            {status === "starting" ? "Starting..." : "Start game"}
          </Button>
        )}

        <Button variant="ghost" onClick={handleLeave} className="text-muted">
          <LogOut size={14} className="mr-1" />
          Leave
        </Button>
      </div>
    </PageShell>
  );
}

/** Player row */
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
      className={`flex items-center justify-between rounded-lg border px-4 py-3 bg-surface ${
        isSelf
          ? "ring-1 ring-rose/40 border-border"
          : "border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">
          {player.username}
          {isSelf && <span className="ml-1 text-xs text-muted">(you)</span>}
        </span>
        {isHost && (
          <Badge variant="outline" className="gap-0.5 text-[10px] uppercase tracking-wide">
            <Crown size={10} />
            Host
          </Badge>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          player.ready ? "text-success" : "text-muted"
        }`}
      >
        {player.ready ? <Check size={12} /> : <X size={12} />}
        {player.ready ? "Ready" : "Not ready"}
      </span>
    </div>
  );
}
