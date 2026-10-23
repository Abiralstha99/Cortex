// Socket.io event handlers for in-game events (after game_started).

import type { Server, Socket } from "socket.io";
import { ResumeGamePayloadSchema, SubmitAnswerPayloadSchema } from "../schemas/game.js";
import { parseSocketPayload } from "./parsePayload.js";
import { submitAnswer } from "../services/answer.service.js";
import { endRound, cancelRoundEndJob } from "../services/roundEnd.service.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import redis from "../lib/redis.js";
import type { AnswerResult, Player } from "../types/room.types.js";
import { isGameMember, resumeGame, type ResumeResponse } from "../services/gameResume.service.js";

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on("resume_game", async (payload: unknown, acknowledge?: (response: ResumeResponse) => void) => {
    if (typeof acknowledge !== "function") return;
    const parsed = ResumeGamePayloadSchema.safeParse(payload);
    if (!parsed.success) return acknowledge({ ok: false, reason: "invalid_game" });
    try {
      const game = await redis.hgetall(GAME_KEY(parsed.data.gameId));
      if (!game?.players || (game.status !== "playing" && game.status !== "finished")) {
        return acknowledge({ ok: false, reason: "unavailable" });
      }
      if (!isGameMember(game, socket.data.userId)) {
        return acknowledge({ ok: false, reason: "not_member" });
      }
      await socket.join(`game:${parsed.data.gameId}`);
      acknowledge(await resumeGame(parsed.data.gameId, socket.data.userId));
    } catch (error) {
      console.error("resume_game error:", error);
      acknowledge({ ok: false, reason: "temporary" });
    }
  });

  socket.on("submit_answer", async (payload: unknown, acknowledge?: (response: { ok: true; result: AnswerResult } | { ok: false; reason: string }) => void) => {
    const parsed = parseSocketPayload(socket, SubmitAnswerPayloadSchema, payload);
    if (!parsed) {
      acknowledge?.({ ok: false, reason: "Invalid answer" });
      return;
    }

    let accepted = false;
    try {
      const game = await redis.hgetall(GAME_KEY(parsed.gameId));
      if (!game || Object.keys(game).length === 0) {
        throw new Error(`Game ${parsed.gameId} not found`);
      }
      if (game.status !== "playing" || !isGameMember(game, socket.data.userId)) {
        throw new Error("Player is not in this game");
      }
      const currentRound = parseInt(game.currentRound!);
      const totalPlayers = (JSON.parse(game.players!) as Player[]).length;

      const result = await submitAnswer({
        ...parsed,
        playerId: socket.data.userId,
        totalPlayers,
        roundNumber: currentRound,
      });
      accepted = true;

      socket.emit("answer_result", { ...result.result, phaseVersion: Number(game.phaseVersion ?? 0) });
      acknowledge?.({ ok: true, result: result.result });
      socket.to(`game:${parsed.gameId}`).emit("answer_submitted", {
        playerId: socket.data.userId,
        username: socket.data.username,
        phaseVersion: Number(game.phaseVersion ?? 0),
      });

      if (result.allAnswered) {
        await cancelRoundEndJob(parsed.gameId, currentRound);
        await endRound(parsed.gameId, currentRound, io);
      }


    } catch (error) {
      if (accepted) {
        console.error("Failed to close round after accepted answer:", error);
        return;
      }
      if (error instanceof Error) {
        acknowledge?.({ ok: false, reason: error.message });
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("submit_answer unexpected error:", error);
      acknowledge?.({ ok: false, reason: "Failed to submit answer" });
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });
}
