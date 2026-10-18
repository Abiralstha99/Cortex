import type { Server, Socket } from "socket.io";
import {
  joinWaitingGame,
  setPlayerReady,
  leaveWaitingGame,
  startGame,
} from "../services/lobby.service.js";
import { startRound, beginRoundClock } from "../services/round.service.js";
import { scheduleRoundEnd } from "../services/roundEnd.service.js";
import { ROUND_TIME_LIMIT_MS } from "../services/answer.service.js";
import { JoinGamePayloadSchema } from "../schemas/game.js";
import { parseSocketPayload } from "./parsePayload.js";
import { publicNewQuestionFromRound } from "../services/gamePlay.helpers.js";
import { publishGamePhase } from "../services/gameResume.service.js";
import {
  announcePublicWaitingUpsert,
  retractPublicWaitingRoom,
} from "../services/publicWaitingFeed.service.js";

const ROUND_START_DELAY_MS = 3000;

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
        quizId: game.quizId,
        quizGenStatus: game.quizGenStatus,
        quizGenError: game.quizGenError,
        numberOfRounds: game.numberOfRounds,
        maxPlayers: game.maxPlayers,
        players: game.players,
      });

      // Notify other players only if this is a new join
      if (isNewJoin) {
        socket.to(`game:${game.gameId}`).emit("player_joined", {
          id: socket.data.userId,
          username: socket.data.username,
          ready: false,
        });
        announcePublicWaitingUpsert(io, game);
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

  socket.on("start_game", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, JoinGamePayloadSchema, payload);
    if (!parsed) return;

    try {
      const { game } = await startGame(parsed.roomCode);

      await retractPublicWaitingRoom(io, {
        gameId: game.gameId,
        wasPublic: game.isPublic,
      });

      // Emit game_started immediately
      const countdown = await publishGamePhase(game.gameId, "countdown", {
        gameId: game.gameId,
        countdownMs: ROUND_START_DELAY_MS,
        countdownEndsAt: Date.now() + ROUND_START_DELAY_MS,
      });
      io.to(`game:${game.gameId}`).emit("game_started", countdown);

      // Prepare the first cached question during the countdown, then start the clock
      // only when players actually see the question (avoids a ~3s timer deficit).
      const roundPromise = startRound(game.gameId, 0);

      setTimeout(async () => {
        try {
          const round = await roundPromise;
          if (!round) return;
          const startedAt = await beginRoundClock(game.gameId);

          const question = await publishGamePhase(game.gameId, "question",
            publicNewQuestionFromRound({ ...round, startedAt }));
          io.to(`game:${game.gameId}`).emit("new_question", question);

          await scheduleRoundEnd(
            game.gameId,
            round.roundNumber,
            ROUND_TIME_LIMIT_MS,
          );
        } catch (err) {
          console.error("startRound error:", err);
          io.to(`game:${game.gameId}`).emit("error", {
            message: "Failed to start round",
          });
        }
      }, ROUND_START_DELAY_MS);
    } catch (error) {
      if (error instanceof Error) {
        socket.emit("error", { message: error.message });
        return;
      }
      console.error("start_game unexpected error:", error);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

  socket.on("leave_game", async (payload: unknown) => {
    const parsed = parseSocketPayload(socket, JoinGamePayloadSchema, payload);
    if (!parsed) {
      return;
    }
    try {
      const { game, leftPlayerId, gameId, wasPublic } = await leaveWaitingGame(
        parsed.roomCode,
        socket.data.userId,
      );

      if (!game) {
        await retractPublicWaitingRoom(io, { gameId, wasPublic });
        return;
      }
      io.to(`game:${game.gameId}`).emit("player_left", {
        id: leftPlayerId,
        game,
      });
      announcePublicWaitingUpsert(io, game);
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
