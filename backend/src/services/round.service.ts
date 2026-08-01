import redis from "../lib/redis.js";
import { GAME_KEY, ROUND_KEY, NEXT_COUNTRY_KEY } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";
import type {
  Difficulty,
  Round,
  ActiveGame,
  Player,
} from "../types/room.types.js";

function deserializeActiveGame(raw: Record<string, string>): ActiveGame {
  if (!raw.status || raw.status !== "playing") {
    throw new Error("Game is not in playing status");
  }
  if (!raw.gameId || !raw.difficulty || !raw.hostId || !raw.roomCode) {
    throw new Error("Game hash is missing required fields");
  }

  const players: Player[] = JSON.parse(raw.players ?? "[]");
  const usedCountryIds: number[] = JSON.parse(raw.usedCountryIds ?? "[]");

  return {
    gameId: raw.gameId,
    difficulty: raw.difficulty as ActiveGame["difficulty"],
    players,
    status: "playing",
    hostId: raw.hostId,
    roomCode: raw.roomCode,
    createdAt: new Date(raw.createdAt!),
    numberOfRounds: Number(raw.numberOfRounds),
    currentRound: Number(raw.currentRound ?? 0),
    usedCountryIds,
  };
}
async function pickCountry(
  difficulty: Difficulty,
  usedIds: number[],
): Promise<{ id: number; name: string; capital: string }> {
  const country = await prisma.country.findMany({
    where: {
      difficulty,
      id: {
        notIn: usedIds,
      },
    },
  });

  if (!country) {
    throw new Error("No country found");
  }

  const randomIndex = Math.floor(Math.random() * country.length);
  if (!country[randomIndex]) {
    throw new Error("No country found");
  }
  return {
    id: country[randomIndex].id,
    name: country[randomIndex].name,
    capital: country[randomIndex].capital,
  };
}

export async function prefetchNextCountry(gameId: string): Promise<void> {
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw || !Object.keys(raw).length) {
    throw new Error("Game not found");
  }
  const parsedGame = deserializeActiveGame(raw);
  const difficulty = parsedGame.difficulty;
  const usedCountryIds = parsedGame.usedCountryIds;
  const nextCountry = await pickCountry(difficulty, usedCountryIds);
  try {
    await redis.set(NEXT_COUNTRY_KEY(gameId), JSON.stringify(nextCountry));
  } catch (error) {
    throw new Error("Failed to prefetch next country", { cause: error });
  }
}

export async function startRound(gameId: string): Promise<Round> {
  // Read current game state
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw || !Object.keys(raw).length) {
    throw new Error("Game not found");
  }
  const game = deserializeActiveGame(raw);

  // Use the prefetched country if available, otherwise hit Postgres now
  const prefetched = await redis.get(NEXT_COUNTRY_KEY(gameId));
  const question: { id: number; name: string; capital: string } = prefetched
    ? JSON.parse(prefetched)
    : await pickCountry(game.difficulty, game.usedCountryIds);

  // Build the round
  const roundNumber = game.currentRound + 1;
  const startedAt = new Date().toISOString();
  const updatedUsedIds = JSON.stringify([...game.usedCountryIds, question.id]);

  const round: Round = {
    countryId: question.id,
    country: question.name,
    capital: question.capital,
    startedAt,
    roundNumber,
  };

  // Atomic write: promote round, advance game state, clear prefetch buffer
  try {
    await redis
      .multi()
      .hset(ROUND_KEY(gameId), {
        roundNumber: String(roundNumber),
        countryId: String(question.id),
        country: question.name,
        capital: question.capital,
        startedAt,
      })
      .hset(GAME_KEY(gameId), {
        currentRound: String(roundNumber),
        usedCountryIds: updatedUsedIds,
      })
      .del(NEXT_COUNTRY_KEY(gameId))
      .exec();

    // Kick off the next prefetch in the background
    void prefetchNextCountry(gameId);
    return round;
  } catch (error) {
    throw new Error("Failed to start round", { cause: error });
  }
}
