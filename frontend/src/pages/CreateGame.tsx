import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import AppHeader from "../components/AppHeader";
import { createWaitingGame } from "../lib/api";
import "./CreateGame.css";

// TODO(Phase 4): replace with quiz picker + GET /api/quizzes.
// Until then, seed a quiz (`npm run seed:quiz`) and set VITE_DEV_QUIZ_ID.
const DEV_QUIZ_ID = import.meta.env.VITE_DEV_QUIZ_ID as string | undefined;

export default function CreateGame() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [quizId, setQuizId] = useState(DEV_QUIZ_ID ?? "");
  const [rounds, setRounds] = useState(10);

  const mutation = useMutation({
    mutationFn: async ({
      quizId,
      rounds,
    }: {
      quizId: string;
      rounds: number;
    }) => {
      const token = await getToken();
      return createWaitingGame(token, { quizId, rounds });
    },
    onSuccess: (data) => {
      navigate(`/game/lobby/${data.roomCode}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ quizId: quizId.trim(), rounds });
  }

  return (
    <div className="create-game">
      <AppHeader />
      <main className="create-game__main">
        <p className="eyebrow create-game__eyebrow">NEW ROOM</p>
        <h1 className="create-game__heading">CREATE A GAME</h1>

        <form className="create-game__form" onSubmit={handleSubmit}>
          <div className="create-game__field">
            <label className="create-game__label" htmlFor="quizId">
              QUIZ ID
            </label>
            {/* TODO(Phase 4): full quiz picker UI */}
            <input
              id="quizId"
              className="create-game__rounds-value"
              style={{
                width: "100%",
                textAlign: "left",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              placeholder="UUID from npm run seed:quiz"
              required
            />
            <span className="create-game__rounds-hint">
              Paste a quiz UUID (Phase 2 temporary). Phase 4 will add a picker.
            </span>
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
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Failed to create game"}
            </p>
          )}

          <button
            type="submit"
            className="create-game__submit"
            disabled={mutation.isPending || !quizId.trim()}
          >
            {mutation.isPending ? "CREATING…" : "CREATE ROOM"}
          </button>
        </form>
      </main>
    </div>
  );
}
