import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HostJoinCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Create - primary weight, spans 2 cols */}
      <div className="md:col-span-2 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">
          Create a quiz room
        </h2>
        <p className="text-sm text-muted mb-4">
          Upload your notes, generate questions, and host a live session.
        </p>
        <Button
          variant="rose"
          onClick={() => navigate("/game/create")}
        >
          Create quiz
          <ArrowRight size={14} className="ml-1.5" />
        </Button>
      </div>

      {/* Join - secondary weight */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">
          Join a room
        </h2>
        <p className="text-sm text-muted mb-4">
          Enter a room code and compete in real-time.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/game/join")}
        >
          Join room
          <ArrowRight size={14} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
