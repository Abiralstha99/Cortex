import type { Server, Socket } from "socket.io";
import {
  joinWaitingGame,
  setPlayerReady,
  leaveWaitingGame,
} from "../services/lobby.service.js";
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

      // Attach the game ID to the socket for later use
      socket.data.gameId = game.gameId;

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
    } catch (error) {
      if (error instanceof Error) {
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("join_game unexpected error:", error);
      socket.emit("error", { message: "Failed to join game" });
    }
  });

  socket.on("player_ready", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, JoinGamePayloadSchema, payload);
    if (!parsed) {
      return;
    }
    try {
      const { ready, gameId } = await setPlayerReady(
        parsed.roomCode,
        socket.data.userId,
      );
      io.to(`game:${gameId}`).emit("player_ready", {
        id: socket.data.userId,
        username: socket.data.username,
        ready,
      });
    } catch (error) {
      if (error instanceof Error) {
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("player_ready unexpected error:", error);
      socket.emit("error", { message: "Failed to set ready status" });
    }
  });

  socket.on("leave_game", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, JoinGamePayloadSchema, payload);
    if (!parsed) {
      return;
    }
    try {
      const { game, leftPlayerId } = await leaveWaitingGame(
        parsed.roomCode,
        socket.data.userId,
      );

      if (!game) {
        return;
      }
      io.to(`game:${game.gameId}`).emit("player_left", {
        id: leftPlayerId,
        game,
      });
    } catch (error) {
      if (error instanceof Error) {
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("leave_game unexpected error:", error);
      socket.emit("error", { message: "Failed to leave game" });
    }
  });
}
