import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicWaitingRoomSummary } from "@/lib/api";

function generationStatusLabel(status: PublicWaitingRoomSummary["quizGenStatus"]) {
  switch (status) {
    case "ready":
      return "Quiz ready";
    case "processing":
      return "Generating questions...";
    case "failed":
      return "Quiz unavailable";
    case "none":
      return "Quiz not selected";
  }
}

export default function LiveRoomCard({
  room,
  onJoin,
}: {
  room: PublicWaitingRoomSummary;
  onJoin: (roomCode: string) => void;
}) {
  const isFull = room.playerCount >= room.maxPlayers;
  const status = generationStatusLabel(room.quizGenStatus);

  return (
    <li
      className={`flex min-h-56 flex-col rounded-[var(--radius-panel)] border bg-surface p-5 shadow-card ${
        isFull ? "border-border opacity-70" : "border-border"
      }`}
    >
      <p className="font-mono text-base font-semibold tracking-widest text-ink">
        {room.roomCode}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Host {room.hostUsername}</p>

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <UsersRound className="size-4" aria-hidden="true" />
          {room.playerCount} / {room.maxPlayers} players
        </span>
        <span aria-hidden="true">•</span>
        <span className="tabular-nums">{room.numberOfRounds} questions</span>
        <span aria-hidden="true">•</span>
        <span>Generation: {status}</span>
      </p>

      <Button
        type="button"
        className="mt-auto w-full active:translate-y-px"
        disabled={isFull}
        aria-label={isFull ? `${room.roomCode} is full` : `Join ${room.roomCode}`}
        onClick={() => onJoin(room.roomCode)}
      >
        {isFull ? "Room full" : "Join room"}
      </Button>
    </li>
  );
}
