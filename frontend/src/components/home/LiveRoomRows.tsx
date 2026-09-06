import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublicWaitingGames, type PublicWaitingRoomSummary } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

const PUBLIC_ROOMS_QUERY_KEY = ["public-waiting-rooms"] as const;

function upsertPublicRoom(
  rooms: PublicWaitingRoomSummary[] | undefined,
  incoming: PublicWaitingRoomSummary,
) {
  const next = (rooms ?? []).filter((r) => r.gameId !== incoming.gameId);
  next.push(incoming);
  next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return next;
}

export default function LiveRoomRows() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  // Register hooks in stable order; enable query only when auth is ready.
  const query = useQuery({
    queryKey: PUBLIC_ROOMS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      return listPublicWaitingGames(token);
    },
    enabled: isLoaded && isSignedIn,
  });

  useEffect(() => {
    // Guard effect by auth and socket readiness.
    if (!isLoaded || !isSignedIn) return;
    if (!socket || !connected) return;
    socket.emit("watch_public_rooms");
    void queryClient.invalidateQueries({ queryKey: PUBLIC_ROOMS_QUERY_KEY });

    const onSave = (room: PublicWaitingRoomSummary) =>
      queryClient.setQueryData<PublicWaitingRoomSummary[]>(PUBLIC_ROOMS_QUERY_KEY, (cur) =>
        upsertPublicRoom(cur, room),
      );
    const onRemoved = (payload: { gameId: string }) =>
      queryClient.setQueryData<PublicWaitingRoomSummary[]>(PUBLIC_ROOMS_QUERY_KEY, (cur) =>
        (cur ?? []).filter((r) => r.gameId !== payload.gameId),
      );

    socket.on("save_as_public", onSave);
    socket.on("public_room_removed", onRemoved);
    return () => {
      socket.off("save_as_public", onSave);
      socket.off("public_room_removed", onRemoved);
      socket.emit("unwatch_public_rooms");
    };
  }, [socket, connected, queryClient, isLoaded, isSignedIn]);

  // After hooks are registered (including effects), avoid rendering for unauthenticated users.
  if (!isLoaded || !isSignedIn) return null;

  if (query.isLoading) {
    return <div aria-label="public-rooms-loading"><Skeleton className="h-6 w-36" /></div>;
  }

  if (query.isError) {
    return (
      <div className="inline-flex items-center space-x-2" aria-label="public-rooms-error">
        <span className="text-sm text-ink-muted">Could not load public rooms</span>
        <button onClick={() => void query.refetch()} className="underline text-sm">Try again</button>
      </div>
    );
  }

  const rooms = query.data ?? [];
  if (rooms.length === 0) return null;

  return (
    <section aria-label="Live rooms">
      <h2 className="text-sm font-medium text-ink-muted">Open public rooms</h2>
      <ul className="mt-2 space-y-1">
        {rooms.map((r) => (
          <li key={r.gameId}>
            <button
              className="w-full text-left px-2 py-2 rounded hover:bg-surface/80"
              onClick={() => navigate(`/game/lobby/${r.roomCode}`)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.hostUsername}</span>
                <span className="ml-4 text-xs text-ink-muted">{r.playerCount}/{r.maxPlayers}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

