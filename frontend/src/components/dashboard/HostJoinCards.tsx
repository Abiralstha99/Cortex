import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HostJoinCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        type="button"
        onClick={() => navigate("/game/create")}
        className="relative rounded-2xl bg-pastel-cream border border-border p-8 text-left cursor-pointer transition-shadow hover:shadow-sm"
      >
        <p className="label-caps text-muted mb-2">HOST</p>
        <h2 className="text-xl font-semibold text-ink mb-2">
          Create a quiz room
        </h2>
        <p className="text-muted text-sm">
          Upload your notes, generate questions, and host a live session.
        </p>
        <ArrowRight
          size={20}
          className="absolute bottom-8 right-8 text-muted"
        />
      </button>

      <button
        type="button"
        onClick={() => navigate("/game/join")}
        className="relative rounded-2xl bg-pastel-mint border border-border p-8 text-left cursor-pointer transition-shadow hover:shadow-sm"
      >
        <p className="label-caps text-muted mb-2">PLAYER</p>
        <h2 className="text-xl font-semibold text-ink mb-2">
          Join a quiz room
        </h2>
        <p className="text-muted text-sm">
          Enter a room code from your host and compete in real-time.
        </p>
        <ArrowRight
          size={20}
          className="absolute bottom-8 right-8 text-muted"
        />
      </button>
    </div>
  );
}
