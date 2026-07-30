import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import AppHeader from "../components/AppHeader";
import { createWaitingGame, type Difficulty } from "../lib/api";
import "./CreateGame.css";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function CreateGame() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [rounds, setRounds] = useState(10);

  const mutation = useMutation({
    mutationFn: async ({ difficulty, rounds }: { difficulty: Difficulty; rounds: number }) => {
      const token = await getToken();
      return createWaitingGame(token, { difficulty, rounds });
    },
    onSuccess: (data) => {
      navigate(`/game/lobby/${data.roomCode}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ difficulty, rounds });
  }

  return (
    <div className="create-game">
      <AppHeader />
      <main className="create-game__main">
        <p className="eyebrow create-game__eyebrow">NEW ROOM</p>
        <h1 className="create-game__heading">CREATE A GAME</h1>

        <form className="create-game__form" onSubmit={handleSubmit}>
          <div className="create-game__field">
            <label className="create-game__label" htmlFor="difficulty">
              DIFFICULTY
            </label>
            <div className="create-game__difficulty-group">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`create-game__difficulty-btn${difficulty === d ? " create-game__difficulty-btn--active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="create-game__field">
            <label className="create-game__label" htmlFor="rounds">
              ROUNDS
            </label>
            <div className="create-game__rounds-row">
              <button
                type="button"
                className="create-game__rounds-btn"
                onClick={() => setRounds((r) => Math.max(3, r - 1))}
                aria-label="Decrease rounds"
              >
                −
              </button>
              <span className="create-game__rounds-value">{rounds}</span>
              <button
                type="button"
                className="create-game__rounds-btn"
                onClick={() => setRounds((r) => Math.min(20, r + 1))}
                aria-label="Increase rounds"
              >
                +
              </button>
            </div>
            <span className="create-game__rounds-hint">3 – 20 rounds</span>
          </div>

          {mutation.error && (
            <p className="create-game__error">
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create game"}
            </p>
          )}

          <button
            type="submit"
            className="create-game__submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "CREATING…" : "CREATE ROOM"}
          </button>
        </form>
      </main>
    </div>
  );
}
