// Round-end service.
//
// Called by two paths:
//   (A) BullMQ worker (roundEnd.worker.ts) — timer expired
//   (B) answer.service.ts — last player submitted
//
// Entry point is endRound(). Both paths call it; the SET NX guard inside
// ensures only one execution proceeds. The other silently returns.
//
// endRound() is also responsible for:
//   - Computing the round_finished payload
//   - Scheduling the next round (or triggering game-finished)

import type { Server } from "socket.io";
import type {
  RoundFinishedPayload,
  LeaderboardEntry,
  GameFinishedPayload,
  Player,
} from "../types/room.types.js";
import { ROUND_END_JOB, roundEndQueue } from "../lib/queue.js";
import {
  GAME_KEY,
  ROUND_ENDED_KEY,
  ROUND_KEY,
  ROUND_END_JOB_ID,
} from "../lib/redisKeys.js";
import redis from "../lib/redis.js";
import { getRoundSubmissions, ROUND_TIME_LIMIT_MS } from "./answer.service.js";
import { startRound } from "./round.service.js";
import { publicNewQuestionFromRound } from "./gamePlay.helpers.js";

export const BETWEEN_ROUND_DELAY_MS = 3000;

// This function attempts to claim the round-end lock via SET NX.
// Returns true if this caller won the lock and should proceed.
// Returns false if another path already ended this round.
async function acquireRoundEndLock(
  gameId: string,
  roundNumber: number,
): Promise<boolean> {
  const key = ROUND_ENDED_KEY(gameId, roundNumber);
  const result = await redis.set(key, "1", "EX", 30, "NX");
  return result === "OK";
}

// Compute the sorted leaderboard from the current game state.
// Reads the players array from GAME_KEY and sorts by cumulative score desc.
export async function computeLeaderboard(
  gameId: string,
): Promise<LeaderboardEntry[]> {
  // TODO: read GAME_KEY players JSON, sort by score desc, assign rank
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game || !game.players) {
    throw new Error(`Game ${gameId} not found`);
  }
  const players = JSON.parse(game.players) as Player[];
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      username: player.username,
      score: player.score,
    }));
}

// Update each player's cumulative score in the GAME_KEY hash.
// Called after submissions are graded, before broadcasting round_finished.
export async function applyScoresToGameState(
  gameId: string,
  scoreDelta: { playerId: string; points: number }[],
): Promise<void> {
  while (true) {
    // Abort if another process has modified the game state.
    await redis.watch(GAME_KEY(gameId));

    const game = await redis.hgetall(GAME_KEY(gameId));
    // If the game state is not found, abort.
    if (!game || !game.players) {
      await redis.unwatch();
      throw new Error(`Game ${gameId} not found`);
    }

    const players = JSON.parse(game.players) as Player[];

    for (const { playerId, points } of scoreDelta) {
      const player = players.find((p) => p.id === playerId);

      if (!player) {
        await redis.unwatch();
        throw new Error(`Player ${playerId} not found in game ${gameId}`);
      }

      player.score = (player.score ?? 0) + points;
    }

    const updatedPlayers = JSON.stringify(players);

    const result = await redis
      .multi()
      .hset(GAME_KEY(gameId), "players", updatedPlayers)
      .exec();

    // If WATCH detected a conflicting write, EXEC returns null.
    // Retry with the latest state.
    if (result !== null) {
      return;
    }
  }
}

// This function enqueues the BullMQ delayed job for this round.
// Called by startRound() immediately after broadcasting new_question.
export async function scheduleRoundEnd(
  gameId: string,
  roundNumber: number,
  timeLimitMs: number,
): Promise<void> {
  await roundEndQueue.add(
    ROUND_END_JOB,
    { gameId, roundNumber },
    { delay: timeLimitMs, jobId: ROUND_END_JOB_ID(gameId, roundNumber) },
  );
}

// Cancel the BullMQ job for a round (called when all players answer early).
// No-op if the job has already fired — the SET NX guard handles that race.
export async function cancelRoundEndJob(
  gameId: string,
  roundNumber: number,
): Promise<void> {
  const job = await roundEndQueue.getJob(ROUND_END_JOB_ID(gameId, roundNumber));
  if (job) {
    await job.remove();
  }
  return;
}

// Core round-end handler. Called by both the BullMQ worker and the last-submission path.
// io is needed to broadcast round_finished / new_question / game_finished.
export async function endRound(
  gameId: string,
  roundNumber: number,
  io: Server,
): Promise<void> {
  // 1. Acquire the round-end lock
  const wonLock = await acquireRoundEndLock(gameId, roundNumber);
  // If the round has already ended (lost the lock race), bail out early
  if (!wonLock) {
    return;
  }
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game || Object.keys(game).length === 0) {
    throw new Error(`Game ${gameId} not found`);
  }

  const round = await redis.hgetall(ROUND_KEY(gameId));
  if (!round || Object.keys(round).length === 0) {
    throw new Error(`Round ${roundNumber} not found`);
  }
  const players = JSON.parse(game.players!) as Player[];
  const numberOfRounds = parseInt(game.numberOfRounds!);
  const currentRound = parseInt(game.currentRound!);

  // Get all submissions for this round
  const submissions = await getRoundSubmissions(
    gameId,
    roundNumber,
    players.map((p) => p.id),
  );

  // Apply scores to game state
  await applyScoresToGameState(
    gameId,
    submissions.map((s) => ({ playerId: s.playerId, points: s.pointsEarned })),
  );

  // Compute leaderboard
  const leaderboard = await computeLeaderboard(gameId);

  // Build and broadcast round_finished payload
  const isLastRound = currentRound >= numberOfRounds;
  const options: string[] = JSON.parse(round.options ?? "[]");
  const correctIndex = Number(round.correctIndex);
  const correctAnswer = options[correctIndex] ?? "";

  const payload: RoundFinishedPayload = {
    roundNumber,
    correctAnswer,
    leaderboard,
    submissions: submissions.map((sub) => ({
      playerId: sub.playerId,
      correct: sub.correct,
      pointsEarned: sub.pointsEarned,
      placement: sub.placement,
    })),
    isLastRound,
    nextRoundIn: isLastRound ? 0 : BETWEEN_ROUND_DELAY_MS,
  };
  io.to(`game:${gameId}`).emit("round_finished", payload);

  // Decide next action: end game or start next round
  if (currentRound >= numberOfRounds) {
    await endGame(gameId, io);
  } else {
    // Schedule next round after a delay
    setTimeout(async () => {
      try {
        const nextRound = await startRound(gameId);

        // Emit new_question to the room
        io.to(`game:${gameId}`).emit(
          "new_question",
          publicNewQuestionFromRound(nextRound),
        );

        // Schedule round-end job
        await scheduleRoundEnd(
          gameId,
          nextRound.roundNumber,
          ROUND_TIME_LIMIT_MS,
        );
      } catch (error) {
        console.error(`Failed to start next round for game ${gameId}:`, error);
      }
    }, BETWEEN_ROUND_DELAY_MS);
  }
}

// Compute final ranks and broadcast game_finished.
// Does NOT write to Postgres — that is Phase 4 (persistence).
export async function endGame(gameId: string, io: Server): Promise<void> {
  // Compute final leaderboard
  const leaderboard = await computeLeaderboard(gameId);
  const winner = leaderboard[0];

  if (!winner) {
    throw new Error("No winner found");
  }

  // Build and broadcast game_finished payload
  const payload: GameFinishedPayload = {
    finalLeaderboard: leaderboard,
    winner: {
      playerId: winner.playerId,
      username: winner.username,
      score: winner.score,
    },
  };

  io.to(`game:${gameId}`).emit("game_finished", payload);

  // Update game status to finished
  await redis.hset(GAME_KEY(gameId), "status", "finished");
}
