// Answer submission service.
//
// Responsibilities:
//   - Validate a submission is within the time limit
//   - Reject duplicate submissions (one per player per round)
//   - Grade the answer (index equality against the correct MCQ option)
//   - Atomically record the submission and award placement via Lua script
//   - Determine whether this submission ends the round early (all players answered)

import redis from "../lib/redis.js";
import {
  ROUND_KEY,
  SUBMISSION_KEY,
  CORRECT_COUNT_KEY,
} from "../lib/redisKeys.js";
import type { SubmissionRecord, AnswerResult } from "../types/room.types.js";

export const ROUND_TIME_LIMIT_MS = 30_000;

// 1st=100, 2nd=75, 3rd=50, 4th+=25, wrong=0
export function calculatePoints(
  isCorrect: boolean,
  placement: number | null,
): number {
  if (!isCorrect) return 0;
  switch (placement) {
    case 1:
      return 100;
    case 2:
      return 75;
    case 3:
      return 50;
    default:
      return 25;
  }
}

/* Atomically:
  1. Guard duplicate via EXISTS on SUBMISSION_KEY
  2. Compare answerIndex with correctIndex (Lua determines correctness)
  3. If correct: INCR CORRECT_COUNT_KEY → placement
  4. HINCRBY ROUND_KEY submissionCount — total submissions so far
  5. SET SUBMISSION_KEY to submissionJson
 Returns: [isDuplicate (0|1), placement (0 if incorrect), totalSubmissions, isCorrect (0|1)]
*/
export const SUBMIT_ANSWER_LUA = `
local submissionKey   = KEYS[1]
local correctCountKey = KEYS[2]
local roundKey        = KEYS[3]
local submissionJson  = ARGV[1]
local answerIndex     = tonumber(ARGV[2])
local correctIndex    = tonumber(ARGV[3])

-- Reject duplicate
if redis.call('EXISTS', submissionKey) == 1 then
  return {1, 0, 0, 0}
end

-- Lua determines correctness (single source of truth)
local isCorrect = (answerIndex == correctIndex) and 1 or 0

local placement = 0
if isCorrect == 1 then
  placement = tonumber(redis.call('INCR', correctCountKey))
end

local totalSubmissions = tonumber(redis.call('HINCRBY', roundKey, 'submissionCount', 1))
redis.call('SET', submissionKey, submissionJson)

return {0, placement, totalSubmissions, isCorrect}
`;

export async function submitAnswer(params: {
  gameId: string;
  roundNumber: number;
  countryId: number;
  playerId: string;
  answerIndex: number;
  responseTime: number;
  totalPlayers: number;
}): Promise<{ result: AnswerResult; allAnswered: boolean }> {
  const {
    gameId,
    roundNumber,
    countryId,
    playerId,
    answerIndex,
    responseTime,
    totalPlayers,
  } = params;

  // Read active round state
  const raw = await redis.hgetall(ROUND_KEY(gameId));
  if (!raw || !raw.countryId) {
    throw new Error("No active round found");
  }

  // Validate this submission is for the current round (guards against stale events)
  if (Number(raw.countryId) !== countryId) {
    throw new Error("Stale submission for wrong round");
  }

  const correctIndex = Number(raw.correctIndex);
  const startedAt = new Date(raw.startedAt!).getTime();
  const submittedAt = new Date().toISOString();

  // Reject late submissions immediately — round timer has elapsed
  const timeTaken = Date.now() - startedAt;
  if (timeTaken > ROUND_TIME_LIMIT_MS) {
    throw new Error("Submission received after round time limit");
  }

  // Atomic Lua script (Lua determines correctness)
  const submissionKey = SUBMISSION_KEY(gameId, roundNumber, playerId);
  const correctCountKey = CORRECT_COUNT_KEY(gameId, roundNumber);
  const roundKey = ROUND_KEY(gameId);

  // Build a base record (correctness will be determined by Lua)
  const baseRecord = {
    playerId,
    roundNumber,
    countryId,
    answerIndex,
    submittedAt,
  };

  const result = (await redis.eval(
    SUBMIT_ANSWER_LUA,
    3,
    submissionKey,
    correctCountKey,
    roundKey,
    JSON.stringify(baseRecord),
    answerIndex.toString(),
    correctIndex.toString(),
  )) as [number, number, number, number];

  const [isDuplicate, rawPlacement, totalSubmissions, isCorrectFlag] = result;

  // Reject duplicate
  if (isDuplicate === 1) {
    throw new Error("Answer already submitted");
  }

  // Use Lua's correctness determination
  const correct = isCorrectFlag === 1;
  const placement = correct ? rawPlacement : null;
  const pointsEarned = calculatePoints(correct, placement);

  // Write the complete record back (now that we know correctness, placement, and points)
  const submissionRecord: SubmissionRecord = {
    ...baseRecord,
    correct,
    pointsEarned,
    placement,
  };
  await redis.set(submissionKey, JSON.stringify(submissionRecord));

  const answerResult: AnswerResult = {
    correct,
    pointsEarned,
    placement,
    correctAnswer: raw.capital!,
  };

  return {
    result: answerResult,
    allAnswered: totalSubmissions >= totalPlayers,
  };
}

// Collect all SubmissionRecord values for a round from Redis.
// Used by round-end logic to build the round_finished payload.
export async function getRoundSubmissions(
  gameId: string,
  roundNumber: number,
  playerIds: string[],
): Promise<SubmissionRecord[]> {
  const submissions: SubmissionRecord[] = [];
  for (const playerId of playerIds) {
    const key = SUBMISSION_KEY(gameId, roundNumber, playerId);
    const raw = await redis.get(key);
    if (!raw) {
      throw new Error("Submission not found");
    }
    const submission = JSON.parse(raw) as SubmissionRecord;
    submissions.push(submission);
  }
  return submissions;
}
