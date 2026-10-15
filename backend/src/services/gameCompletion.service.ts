import type { Server } from "socket.io";
import { prisma } from "../lib/prisma.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import type { Player, SubmissionRecord } from "../types/room.types.js";
import { getRoundSubmissions } from "./answer.service.js";
import { buildGameFinishedPayload, rankPlayers } from "./gameCompletion.helpers.js";
import { persistGameCompletion } from "./gameCompletion.persistence.js";
import { publishGamePhase } from "./gameResume.service.js";

export async function finalizeGame(
  gameId: string,
  finishedAt: string,
  io: Server,
): Promise<void> {
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game || !game.players) {
    throw new Error(`Game ${gameId} not found`);
  }

  const players = JSON.parse(game.players) as Player[];
  if (players.length === 0) {
    throw new Error("No winner found");
  }

  const currentRound = Number.parseInt(game.currentRound ?? "0", 10);
  if (!Number.isInteger(currentRound) || currentRound < 0) {
    throw new Error(`Invalid current round for game ${gameId}`);
  }

  const submissions: SubmissionRecord[] = [];
  for (let roundNumber = 1; roundNumber <= currentRound; roundNumber += 1) {
    const roundSubmissions = await getRoundSubmissions(
      gameId,
      roundNumber,
      players.map((player) => player.id),
    );
    submissions.push(
      ...roundSubmissions.filter(
        (submission) => submission.questionId && submission.answerIndex >= 0,
      ),
    );
  }

  const finalLeaderboard = rankPlayers(players);
  await persistGameCompletion(
    (operation) => prisma.$transaction(operation),
    {
      gameId,
      leaderboard: finalLeaderboard,
      answers: submissions,
      finishedAt: new Date(finishedAt),
    },
  );

  await redis.hset(GAME_KEY(gameId), "status", "finished");
  const result = await publishGamePhase(gameId, "game_finished",
    buildGameFinishedPayload(finalLeaderboard));
  io.to(`game:${gameId}`).emit("game_finished", result);
}
