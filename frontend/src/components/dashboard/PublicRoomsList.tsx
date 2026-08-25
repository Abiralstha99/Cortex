import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/feedback/EmptyState";
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
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        title="Could not load public rooms"
        description="Something went wrong. Try refreshing the page."
      />
    );
  }

  const rooms = query.data ?? [];

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="No public rooms yet"
        description="Create one to get started."
        action={
          <Button variant="outline" onClick={() => navigate("/game/create")}>
            Create quiz
          </Button>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rooms.map((room) => (
        <li
          key={room.gameId}
          className="flex items-center justify-between gap-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tracking-widest text-ink">
              {room.roomCode}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              <span>Host: {room.hostUsername}</span>
              <span className="mx-2 text-border">|</span>
              <span>{room.playerCount}/{room.maxPlayers} players</span>
              <span className="mx-2 text-border">|</span>
              <span>{room.numberOfRounds} questions</span>
              {room.quizGenStatus !== "ready" && (
                <>
                  <span className="mx-2 text-border">|</span>
                  <span className="text-muted">generating...</span>
                </>
              )}
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
