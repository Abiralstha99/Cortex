import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { listPublicWaitingGames } from "@/lib/api";

export default function PublicRoomsList() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["public-waiting-rooms"],
    queryFn: async () => {
      const token = await getToken();
      return listPublicWaitingGames(token);
    },
    refetchInterval: 15_000,
  });

  if (query.isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted">Loading rooms…</p>
    );
  }

  if (query.isError) {
    return (
      <p className="py-8 text-center text-sm text-rose">
        Could not load public rooms.
      </p>
    );
  }

  const rooms = query.data ?? [];

  if (rooms.length === 0) {
    return (
      <p className="py-12 text-center text-muted">
        No public rooms yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rooms.map((room) => (
        <li
          key={room.gameId}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tracking-widest text-ink">
              {room.roomCode}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              Host {room.hostUsername} · {room.playerCount}/{room.maxPlayers}{" "}
              players · {room.numberOfRounds} Q
              {room.quizGenStatus !== "ready" ? " · generating…" : ""}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={room.playerCount >= room.maxPlayers}
            onClick={() => navigate(`/game/lobby/${room.roomCode}`)}
          >
            Join
          </Button>
        </li>
      ))}
    </ul>
  );
}
