import type { Server, Socket } from "socket.io";
import { joinWaitingGame } from "../game/lobbyService.js";
import { JoinGamePayloadSchema } from "../schemas/game.js";
import { parseSocketPayload } from "./parsePayload.js";

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on("join_game", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, JoinGamePayloadSchema, payload);
    if (!parsed) {
      return;
    }

    try {
      const { game, isNewJoin } = await joinWaitingGame({
        roomCode: parsed.roomCode,
        playerId: socket.data.userId,
        playerUsername: socket.data.username,
      });

      // Subscribe to the game's room for future broadcasts
      await socket.join(`game:${game.gameId}`);

      // Send full lobby snapshot to the joining client
      socket.emit("joined", {
        gameId: game.gameId,
        roomCode: game.roomCode,
        hostId: game.hostId,
        difficulty: game.difficulty,
        numberOfRounds: game.numberOfRounds,
        players: game.players,
      });

      // Notify other players only if this is a new join
      if (isNewJoin) {
        socket.to(`game:${game.gameId}`).emit("player_joined", {
          id: socket.data.userId,
          username: socket.data.username,
          ready: false,
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        socket.emit("error", { message: err.message });
        return;
      }
      console.error("join_game unexpected error:", err);
      socket.emit("error", { message: "Failed to join game" });
    }
  });
}
