import redis from "../lib/redis.js";
import { GAME_KEY, ROUND_KEY } from "../lib/redisKeys.js";
import type { Round } from "../types/room.types.js";
import { getQuizQuestions } from "./quizCache.service.js";

const ADVANCE_ROUND_LUA = `
local gameKey = KEYS[1]
local roundKey = KEYS[2]
local expectedRound = tonumber(ARGV[1])
local questionId = ARGV[2]

if redis.call('HGET', gameKey, 'status') ~= 'playing' then return -1 end
if tonumber(redis.call('HGET', gameKey, 'currentRound') or '-1') ~= expectedRound then return 0 end
local order = cjson.decode(redis.call('HGET', gameKey, 'questionOrder') or '[]')
if order[expectedRound + 1] ~= questionId or
   redis.call('HGET', gameKey, 'quizVersion') ~= ARGV[3] then return -2 end

redis.call('HSET', roundKey,
  'roundNumber', tostring(expectedRound + 1),
  'questionId', questionId,
  'question', ARGV[4],
  'type', ARGV[5],
  'content', ARGV[6],
  'explanation', ARGV[7],
  'startedAt', ARGV[8],
  'submissionCount', '0')
redis.call('EXPIRE', roundKey, 7200)
redis.call('HSET', gameKey,
  'currentRound', tostring(expectedRound + 1),
  'currentQuestionIndex', tostring(expectedRound))
return 1
`;

/** Atomically advances exactly one round. A repeated caller receives null. */
export async function startRound(
  gameId: string,
  expectedCurrentRound: number,
): Promise<Round | null> {
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (game.status !== "playing" || !game.quizId || !game.quizVersion) {
    throw new Error("Game is not ready for a round");
  }
  if (Number(game.currentRound) !== expectedCurrentRound) return null;
  if (expectedCurrentRound >= Number(game.numberOfRounds)) {
    throw new Error("No rounds remaining");
  }

  const order = JSON.parse(game.questionOrder ?? "[]") as string[];
  const questionId = order[expectedCurrentRound];
  if (!questionId) throw new Error("Game question order is incomplete");

  const snapshot = await getQuizQuestions(game.quizId, undefined, game.quizVersion);
  const picked = snapshot.questions.find((question) => question.id === questionId);
  if (!picked) throw new Error("Question missing from pinned quiz snapshot");

  const startedAt = new Date().toISOString();
  const advanced = Number(await redis.eval(
    ADVANCE_ROUND_LUA,
    2,
    GAME_KEY(gameId),
    ROUND_KEY(gameId),
    String(expectedCurrentRound),
    picked.id,
    snapshot.version,
    picked.question,
    picked.type,
    JSON.stringify(picked.content),
    picked.explanation,
    startedAt,
  ));
  if (advanced === 0) return null;
  if (advanced !== 1) throw new Error("Game question order changed during round advancement");

  return {
    ...picked,
    questionId: picked.id,
    startedAt,
    roundNumber: expectedCurrentRound + 1,
  };
}

/** Aligns the first round clock with the end of the countdown. */
export async function beginRoundClock(gameId: string): Promise<string> {
  const exists = await redis.exists(ROUND_KEY(gameId));
  if (!exists) throw new Error("Round not found");
  const startedAt = new Date().toISOString();
  await redis.hset(ROUND_KEY(gameId), "startedAt", startedAt);
  return startedAt;
}
