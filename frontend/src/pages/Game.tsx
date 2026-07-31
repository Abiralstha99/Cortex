import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AppHeader from "../components/AppHeader";
import { useLobbyStore } from "../stores/lobbyStore";
import "./Game.css";

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const players = useLobbyStore((s) => s.players);
  const difficulty = useLobbyStore((s) => s.difficulty);
  const numberOfRounds = useLobbyStore((s) => s.numberOfRounds);
  const storeGameId = useLobbyStore((s) => s.gameId);

  // Guard: if someone lands here directly with no game state, send them home
  useEffect(() => {
    if (!storeGameId || storeGameId !== gameId) {
      navigate("/dashboard", { replace: true });
    }
  }, [storeGameId, gameId, navigate]);

  if (!storeGameId) return null;

  return (
    <div className="game">
      <AppHeader />

      <main className="game__main">
        <p className="eyebrow game__eyebrow">IN PROGRESS</p>
        <h1 className="game__heading">CAPITAL RUSH</h1>

        <div className="game__meta">
          <span className="game__tag">{difficulty?.toUpperCase()}</span>
          <span className="game__tag">{numberOfRounds} ROUNDS</span>
        </div>

        <div className="game__placeholder">
          <p className="game__placeholder-text">Round logic coming soon.</p>
          <p className="game__placeholder-sub">
            {players.length} player{players.length !== 1 ? "s" : ""} connected
          </p>
        </div>
      </main>
    </div>
  );
}
