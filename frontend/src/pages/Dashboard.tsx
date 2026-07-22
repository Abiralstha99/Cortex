import type { ReactNode } from "react";
import { Plus, LogIn, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "./Dashboard.css";
import { useSocket } from "../hooks/useSocket";

type ActiveRoom = {
  code: string;
  status: "WAITING" | "IN_PROGRESS";
  playerCount: number;
  maxPlayers: number;
  difficulty: string;
  rounds: number;
};

// No backend endpoint for in-progress rooms yet, so this is always null.
// ActiveRoomPanel already handles that case (renders nothing).
const activeRoom: ActiveRoom | null = null;

const HELPER_STEPS = [
  "Create or join a room",
  "Race through 10 capital questions",
  "Finish higher. Raise your rating.",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { username } = useCurrentUser();
  const { connected, error } = useSocket();
  return (
    <div className="dashboard">
      <AppHeader />

      <main className="dashboard__main">
        <p className="eyebrow dashboard__eyebrow">
          GEOGRAPHY &middot; REAL-TIME &middot; MULTIPLAYER
        </p>
        <h1 className="dashboard__heading">
          WELCOME BACK, {username.toUpperCase()}.
          <br />
          READY TO RACE?
        </h1>

        <div className="dashboard__actions">
          <ActionPanel
            icon={<Plus size={24} strokeWidth={1.75} />}
            title="Create a game"
            desc="Host a room and invite others with a code."
            onClick={() => navigate("/game/create")}
          />
          <ActionPanel
            icon={<LogIn size={24} strokeWidth={1.75} />}
            title="Join a game"
            desc="Drop into a room with a code from your host."
            onClick={() => navigate("/game/join")}
          />
        </div>

        <ActiveRoomPanel room={activeRoom} />

        {!activeRoom && <FirstTimeHelper />}
      </main>

      {error && <div className="error">{error}</div>}
      {connected && <div className="connected">Connected to socket</div>}
    </div>
  );
}

function ActionPanel({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="action-panel" onClick={onClick}>
      <span className="action-panel__icon">{icon}</span>
      <span className="action-panel__title">{title}</span>
      <span className="action-panel__desc">{desc}</span>
    </button>
  );
}

function ActiveRoomPanel({ room }: { room: ActiveRoom | null }) {
  if (!room) return null;

  return (
    <div className="active-room">
      <div className="active-room__header">
        <span className="label">ACTIVE ROOM</span>
        <span className="label active-room__status">
          {room.status.replace("_", " ")}
        </span>
      </div>
      <div className="active-room__body">
        <span className="active-room__code">ROOM {room.code}</span>
        <span className="active-room__players">
          {room.playerCount} / {room.maxPlayers} PLAYERS
        </span>
      </div>
      <span className="active-room__meta">
        {room.difficulty.toUpperCase()} &middot; {room.rounds} ROUNDS
      </span>
      <button type="button" className="active-room__return">
        RETURN TO LOBBY <ArrowRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

function FirstTimeHelper() {
  return (
    <ol className="helper">
      {HELPER_STEPS.map((step, i) => (
        <li className="helper__step" key={step}>
          <span className="helper__step-index">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="helper__step-text">{step.toUpperCase()}</span>
        </li>
      ))}
    </ol>
  );
}
