import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import "./JoinGame.css";

export default function JoinGame() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(value.slice(0, 6));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Room code must be 6 letters or digits");
      return;
    }
    navigate(`/game/lobby/${code}`);
  }

  return (
    <div className="join-game">
      <AppHeader />
      <main className="join-game__main">
        <p className="eyebrow join-game__eyebrow">ENTER ROOM</p>
        <h1 className="join-game__heading">JOIN A GAME</h1>

        <form className="join-game__form" onSubmit={handleSubmit}>
          <div className="join-game__field">
            <label className="join-game__label" htmlFor="room-code">
              ROOM CODE
            </label>
            <input
              id="room-code"
              className="join-game__input"
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="A1B2C3"
              autoComplete="off"
              autoFocus
              maxLength={6}
            />
            {error && <p className="join-game__error">{error}</p>}
          </div>

          <button
            type="submit"
            className="join-game__submit"
            disabled={code.length === 0}
          >
            JOIN ROOM
          </button>
        </form>
      </main>
    </div>
  );
}
