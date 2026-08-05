// Socket.io event handlers for in-game events (after game_started).

import type { Server, Socket } from "socket.io";
import { SubmitAnswerPayloadSchema } from "../schemas/game.js";
import { parseSocketPayload } from "./parsePayload.js";
import { submitAnswer } from "../services/answer.service.js";
import { endRound, cancelRoundEndJob } from "../services/roundEnd.service.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import redis from "../lib/redis.js";
import type { Player } from "../types/room.types.js";

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on("submit_answer", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, SubmitAnswerPayloadSchema, payload);
    if (!parsed) return;

    try {
      const game = await redis.hgetall(GAME_KEY(parsed.gameId));
      if (!game || Object.keys(game).length === 0) {
        throw new Error(`Game ${parsed.gameId} not found`);
      }
      const currentRound = parseInt(game.currentRound!);
      const totalPlayers = (JSON.parse(game.players!) as Player[]).length;

      const result = await submitAnswer({
        ...parsed,
        playerId: socket.data.userId,
        totalPlayers,
        roundNumber: currentRound,
      });

      socket.emit("answer_result", result.result);
      socket.to(`game:${parsed.gameId}`).emit("answer_submitted", {
        playerId: socket.data.userId,
        username: socket.data.username,
      });

      if (result.allAnswered) {
        await cancelRoundEndJob(parsed.gameId, currentRound);
        await endRound(parsed.gameId, currentRound, io);
      }


    } catch (error) {
      if (error instanceof Error) {
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("submit_answer unexpected error:", error);
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });
}
