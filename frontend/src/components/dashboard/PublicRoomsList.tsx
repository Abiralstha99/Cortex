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
      <div className="space-y-3" aria-label="Loading public rooms">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-border bg-cream px-5 py-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full max-w-72" />
            </div>
            <Skeleton className="h-8 w-16 rounded-[var(--radius-control)]" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-border bg-surface">
        <EmptyState
          title="Could not load public rooms"
          description="Something went wrong while finding open rooms."
          action={
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const rooms = query.data ?? [];

  if (rooms.length === 0) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-border bg-surface">
        <EmptyState
          title="No public rooms yet"
          description="Start a public quiz and invite the first players."
          action={
            <Button onClick={() => navigate("/game/create")}>
              Create a quiz
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rooms.map((room) => (
        <li
          key={room.gameId}
          className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-border bg-cream px-5 py-4 shadow-[0_3px_0_0_#d4cbbd] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-mono text-base font-semibold tracking-widest text-ink">
              {room.roomCode}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span>Host: {room.hostUsername}</span>
              <span aria-hidden="true">|</span>
              <span className="tabular-nums">
                {room.playerCount}/{room.maxPlayers} players
              </span>
              <span aria-hidden="true">|</span>
              <span>{room.numberOfRounds} questions</span>
              {room.quizGenStatus !== "ready" && (
                <>
                  <span aria-hidden="true">|</span>
                  <span className="text-muted">generating...</span>
                </>
              )}
            </p>
          </div>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            disabled={room.playerCount >= room.maxPlayers}
            onClick={() => navigate(`/game/lobby/${room.roomCode}`)}
          >
            {room.playerCount >= room.maxPlayers ? "Full" : "Join"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
