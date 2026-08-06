import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut, Play } from "lucide-react";
import AppHeader from "../components/AppHeader";
import LobbyHeader from "../components/lobby/LobbyHeader";
import PlayerCard from "../components/lobby/PlayerCard";
import { useLobbySocket } from "../hooks/useLobbySocket";
import { useLobbyStore } from "../stores/lobbyStore";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "./Lobby.css";

export default function Lobby() {
  const { roomCode = "" } = useParams();
  const normalized = roomCode.toUpperCase();
  const navigate = useNavigate();
  const { connected, toggleReady, startGame, leave } = useLobbySocket(normalized);

  const players = useLobbyStore((s) => s.players);
  const hostId = useLobbyStore((s) => s.hostId);
  const gameId = useLobbyStore((s) => s.gameId);
  const quizId = useLobbyStore((s) => s.quizId);
  const numberOfRounds = useLobbyStore((s) => s.numberOfRounds);
  const status = useLobbyStore((s) => s.status);
  const toast = useLobbyStore((s) => s.toast);
  const attemptStart = useLobbyStore((s) => s.attemptStart);
  const setToast = useLobbyStore((s) => s.setToast);

  const { id: myUserId } = useCurrentUser();
  const isHost = myUserId != null && hostId === myUserId;

  // Navigate everyone to the game screen when the server confirms game_started
  useEffect(() => {
    if (status === "started" && gameId) {
      navigate(`/game/${gameId}`, { replace: true });
    }
  }, [status, gameId, navigate]);

  // When the host clicks Start, validate locally then emit to the server
  function handleStart() {
    attemptStart();
    if (players.every((p) => p.ready)) {
      startGame();
    }
  }

  function handleLeave() {
    leave();
    navigate("/dashboard");
  }

  function dismissToast() {
    setToast(null);
  }

  return (
    <div className="lobby">
      <AppHeader />

      <main className="lobby__main">
        <p className="eyebrow lobby__eyebrow">WAITING ROOM</p>
        <h1 className="lobby__heading">LOBBY</h1>

        <LobbyHeader
          roomCode={normalized}
          quizId={quizId}
          numberOfRounds={numberOfRounds}
          connected={connected}
        />

        {status === "joining" && (
          <p className="lobby__status">Joining room…</p>
        )}

        {status === "error" && (
          <p className="lobby__status lobby__status--error">
            Failed to join room.
          </p>
        )}

        <div className="lobby__players">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.id === hostId}
              isSelf={player.id === myUserId}
            />
          ))}
        </div>

        <div className="lobby__actions">
          <button
            type="button"
            className="lobby__ready-btn"
            onClick={toggleReady}
          >
            TOGGLE READY
          </button>

          {isHost && (
            <button
              type="button"
              className="lobby__start-btn"
              onClick={handleStart}
              disabled={status === "starting"}
            >
              <Play size={16} strokeWidth={2.5} />
              {status === "starting" ? "STARTING…" : "START GAME"}
            </button>
          )}

          <button
            type="button"
            className="lobby__leave-btn"
            onClick={handleLeave}
          >
            <LogOut size={14} strokeWidth={2} />
            LEAVE
          </button>
        </div>

        {toast && (
          <div className="lobby__toast" onClick={dismissToast}>
            <span>{toast}</span>
          </div>
        )}
      </main>
    </div>
  );
}
