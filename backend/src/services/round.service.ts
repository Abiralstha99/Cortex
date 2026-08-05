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
  const countries = await prisma.country.findMany({
    where: { difficulty, id: { notIn: usedIds } },
  });

  if (!countries.length) throw new Error("No country found");

  const randomIndex = Math.floor(Math.random() * countries.length);
  const country = countries[randomIndex];
  if (!country) throw new Error("No country found");

  return { id: country.id, name: country.name, capital: country.capital };
}

// Build 4 MCQ options: 3 wrong capitals from the same difficulty pool + the correct one.
// Returns { options, correctIndex } where options is shuffled.
async function buildOptions(
  difficulty: Difficulty,
  correctCapital: string,
  correctId: number,
): Promise<{ options: string[]; correctIndex: number }> {
  const distractors = await prisma.country.findMany({
    where: { difficulty, id: { not: correctId } },
    select: { capital: true },
  });

  // Fisher-Yates on distractors to pick 3 random wrong answers
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j]!, distractors[i]!];
  }
  const wrong = distractors.slice(0, 3).map((d) => d.capital);

  const options = [...wrong, correctCapital];
  // Shuffle to randomise correct answer position
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }

  return { options, correctIndex: options.indexOf(correctCapital) };
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

  const { options, correctIndex } = await buildOptions(
    game.difficulty,
    question.capital,
    question.id,
  );

  // Build the round
  const roundNumber = game.currentRound + 1;
  const startedAt = new Date().toISOString();
  const updatedUsedIds = JSON.stringify([...game.usedCountryIds, question.id]);

  const round: Round = {
    countryId: question.id,
    country: question.name,
    capital: question.capital,
    options,
    correctIndex,
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
        options: JSON.stringify(options),
        correctIndex: String(correctIndex),
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


