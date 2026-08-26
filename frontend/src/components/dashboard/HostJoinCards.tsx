import { useNavigate } from "react-router-dom";
import { DoorOpen, Plus } from "lucide-react";

export default function HostJoinCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <button
        type="button"
        className="group rounded-[1.75rem] border-[5px] border-white bg-white p-1.5 text-left shadow-[0_6px_0_0_rgb(0_0_0/0.06)] outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgb(0_0_0/0.1)] focus-visible:ring-[3px] focus-visible:ring-forest/30 active:translate-y-0"
        onClick={() => navigate("/game/create")}
      >
        <div className="flex min-h-56 flex-col items-center justify-center gap-5 rounded-[1.25rem] bg-[#bce0f5] px-6 py-12">
          <Plus
            className="size-14 text-ink/90 transition-transform duration-200 group-hover:scale-110"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <div className="text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-wider text-ink">
              Create a quiz
            </p>
            <p className="mt-1.5 text-sm text-ink/65">
              Turn your notes into a room and host the game.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="group rounded-[1.75rem] border-[5px] border-white bg-white p-1.5 text-left shadow-[0_6px_0_0_rgb(0_0_0/0.06)] outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgb(0_0_0/0.1)] focus-visible:ring-[3px] focus-visible:ring-forest/30 active:translate-y-0"
        onClick={() => navigate("/game/join")}
      >
        <div className="flex min-h-56 flex-col items-center justify-center gap-5 rounded-[1.25rem] bg-[#f0de82] px-6 py-12">
          <DoorOpen
            className="size-14 text-ink/90 transition-transform duration-200 group-hover:scale-110"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <div className="text-center">
            <p className="font-display text-sm font-extrabold uppercase tracking-wider text-ink">
              Join a room
            </p>
            <p className="mt-1.5 text-sm text-ink/65">
              Bring a room code and get into the next round.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
