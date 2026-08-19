import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  listPublicWaitingGames,
  type PublicWaitingRoomSummary,
} from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

const PUBLIC_ROOMS_QUERY_KEY = ["public-waiting-rooms"] as const;

function upsertPublicRoom(
  rooms: PublicWaitingRoomSummary[] | undefined,
  incoming: PublicWaitingRoomSummary,
): PublicWaitingRoomSummary[] {
  const next = (rooms ?? []).filter((room) => room.gameId !== incoming.gameId);
  next.push(incoming);
  next.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return next;
}

export default function PublicRoomsList() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  const query = useQuery({
    queryKey: PUBLIC_ROOMS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      return listPublicWaitingGames(token);
    },
  });

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("watch_public_rooms");
    void queryClient.invalidateQueries({ queryKey: PUBLIC_ROOMS_QUERY_KEY });

    const onSaveAsPublic = (room: PublicWaitingRoomSummary) => {
      queryClient.setQueryData<PublicWaitingRoomSummary[]>(
        PUBLIC_ROOMS_QUERY_KEY,
        (current) => upsertPublicRoom(current, room),
      );
    };

    const onRemoved = (payload: { gameId: string }) => {
      queryClient.setQueryData<PublicWaitingRoomSummary[]>(
        PUBLIC_ROOMS_QUERY_KEY,
        (current) =>
          (current ?? []).filter((room) => room.gameId !== payload.gameId),
      );
    };

    socket.on("save_as_public", onSaveAsPublic);
    socket.on("public_room_removed", onRemoved);

    return () => {
      socket.off("save_as_public", onSaveAsPublic);
      socket.off("public_room_removed", onRemoved);
      socket.emit("unwatch_public_rooms");
    };
  }, [socket, connected, queryClient]);

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
