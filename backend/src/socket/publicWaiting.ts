import type { Server, Socket } from "socket.io";
import type { PublicWaitingRoomSummary } from "../services/game.service.js";

export const PUBLIC_WAITING_SOCKET_ROOM = "public-waiting";

export function registerPublicWaitingHandlers(socket: Socket): void {
  socket.on("watch_public_rooms", async () => {
    await socket.join(PUBLIC_WAITING_SOCKET_ROOM);
  });

  socket.on("unwatch_public_rooms", async () => {
    await socket.leave(PUBLIC_WAITING_SOCKET_ROOM);
  });
}

export function emitSaveAsPublic(
  io: Server,
  summary: PublicWaitingRoomSummary,
): void {
  io.to(PUBLIC_WAITING_SOCKET_ROOM).emit("save_as_public", summary);
}

export function emitPublicRoomRemoved(io: Server, gameId: string): void {
  io.to(PUBLIC_WAITING_SOCKET_ROOM).emit("public_room_removed", { gameId });
}

