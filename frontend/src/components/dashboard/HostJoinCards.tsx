import { useNavigate } from "react-router-dom";
import { DoorOpen, Plus } from "lucide-react";
import { StickerCard } from "@/components/brand/StickerCard";

export default function HostJoinCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <button
        type="button"
        className="rounded-[var(--radius-sticker)] text-left outline-none transition-transform duration-150 hover:-translate-y-1 focus-visible:ring-[3px] focus-visible:ring-forest/45 active:translate-y-0"
        onClick={() => navigate("/game/create")}
      >
        <StickerCard
          title="Create a quiz"
          subtitle="Turn your notes into a room and host the game."
          tone="sky"
          icon={<Plus className="size-16" strokeWidth={2.5} aria-hidden="true" />}
          rotate={-1}
          className="h-full min-h-64 w-full"
        />
      </button>

      <button
        type="button"
        className="rounded-[var(--radius-sticker)] text-left outline-none transition-transform duration-150 hover:-translate-y-1 focus-visible:ring-[3px] focus-visible:ring-forest/45 active:translate-y-0"
        onClick={() => navigate("/game/join")}
      >
        <StickerCard
          title="Join a room"
          subtitle="Bring a room code and get into the next round."
          tone="yellow"
          icon={
            <DoorOpen
              className="size-16"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          }
          rotate={1}
          className="h-full min-h-64 w-full"
        />
      </button>
    </div>
  );
}
