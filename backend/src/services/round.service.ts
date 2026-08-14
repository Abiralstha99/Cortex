import redis from "../lib/redis.js";
import { GAME_KEY, ROUND_KEY, NEXT_QUESTION_KEY } from "../lib/redisKeys.js";
import { prisma } from "../lib/prisma.js";
import type {
  Round,
  ActiveGame,
  Player,
  QuestionPick,
} from "../types/room.types.js";

function deserializeActiveGame(raw: Record<string, string>): ActiveGame {
  if (!raw.status || raw.status !== "playing") {
    throw new Error("Game is not in playing status");
  }
  if (!raw.gameId || !raw.quizId || !raw.hostId || !raw.roomCode) {
    throw new Error("Game hash is missing required fields");
  }

  const players: Player[] = JSON.parse(raw.players ?? "[]");
  const usedQuestionIds: string[] = JSON.parse(raw.usedQuestionIds ?? "[]");

  return {
    gameId: raw.gameId,
    quizId: raw.quizId,
    quizGenStatus: "ready",
    quizGenJobId: raw.quizGenJobId?.trim() ? raw.quizGenJobId : null,
    quizGenError: null,
    players,
    status: "playing",
    hostId: raw.hostId,
    roomCode: raw.roomCode,
    createdAt: new Date(raw.createdAt!),
    numberOfRounds: Number(raw.numberOfRounds),
    currentRound: Number(raw.currentRound ?? 0),
    usedQuestionIds,
  };
}

function parseOptions(options: unknown): string[] {
  if (!Array.isArray(options) || options.length !== 4) {
    throw new Error("Question options must be a JSON array of length 4");
  }
  if (!options.every((o) => typeof o === "string")) {
    throw new Error("Question options must be strings");
  }
  return options as string[];
}

export async function pickQuestion(
  quizId: string,
  usedIds: string[],
): Promise<QuestionPick> {
  const rows = await prisma.question.findMany({
    where: {
      quizId,
      ...(usedIds.length ? { id: { notIn: usedIds } } : {}),
    },
    orderBy: { position: "asc" },
  });

  if (!rows.length) throw new Error("No unused questions left in quiz");

  const row = rows[Math.floor(Math.random() * rows.length)]!;
  const options = parseOptions(row.options);

  if (row.correctIndex < 0 || row.correctIndex > 3) {
    throw new Error("Invalid correctIndex on question");
  }

  return {
    id: row.id,
    question: row.question,
    options,
    correctIndex: row.correctIndex,
    explanation: row.explanation,
  };
}

export async function prefetchNextQuestion(gameId: string): Promise<void> {
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw || !Object.keys(raw).length) {
    throw new Error("Game not found");
  }

  const game = deserializeActiveGame(raw);
  if (!game.quizId) throw new Error("Game has no playable quiz");
  const next = await pickQuestion(game.quizId, game.usedQuestionIds);

  try {
    await redis.set(NEXT_QUESTION_KEY(gameId), JSON.stringify(next));
  } catch (error) {
    throw new Error("Failed to prefetch next question", { cause: error });
  }
}

export async function startRound(gameId: string): Promise<Round> {
  const raw = await redis.hgetall(GAME_KEY(gameId));
  if (!raw || !Object.keys(raw).length) {
    throw new Error("Game not found");
  }
  const game = deserializeActiveGame(raw);
  if (!game.quizId) throw new Error("Game has no playable quiz");

  const prefetched = await redis.get(NEXT_QUESTION_KEY(gameId));
  const picked: QuestionPick = prefetched
    ? (JSON.parse(prefetched) as QuestionPick)
    : await pickQuestion(game.quizId, game.usedQuestionIds);

  const roundNumber = game.currentRound + 1;
  const startedAt = new Date().toISOString();
  const updatedUsedIds = JSON.stringify([...game.usedQuestionIds, picked.id]);

  const round: Round = {
    questionId: picked.id,
    question: picked.question,
    options: picked.options,
    correctIndex: picked.correctIndex,
    explanation: picked.explanation,
    startedAt,
    roundNumber,
  };

  try {
    await redis
      .multi()
      .hset(ROUND_KEY(gameId), {
        roundNumber: String(roundNumber),
        questionId: picked.id,
        question: picked.question,
        options: JSON.stringify(picked.options),
        correctIndex: String(picked.correctIndex),
        explanation: picked.explanation,
        startedAt,
        submissionCount: "0",
      })
      .hset(GAME_KEY(gameId), {
        currentRound: String(roundNumber),
        usedQuestionIds: updatedUsedIds,
      })
      .del(NEXT_QUESTION_KEY(gameId))
      .exec();

    void prefetchNextQuestion(gameId);
    return round;
  } catch (error) {
    throw new Error("Failed to start round", { cause: error });
  }
}
