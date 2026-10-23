// Answer submission service.
//
// Responsibilities:
//   - Validate a submission is within the time limit
//   - Reject duplicate submissions (one per player per round)
//   - Grade the typed answer against server-only question content
//   - Atomically record the submission and award placement via Lua script
//   - Determine whether this submission ends the round early (all players answered)

import { QuestionContentSchema } from "../schemas/quiz.js";
import { correctAnswerLabel, gradeAnswer, isAnswerValueForQuestion, type AnswerValue, type QuestionContent } from "./questionAnswer.service.js";
import redis from "../lib/redis.js";
import {
  ROUND_KEY,
  SUBMISSION_KEY,
  CORRECT_COUNT_KEY,
  ROUND_ENDED_KEY,
} from "../lib/redisKeys.js";
import type { SubmissionRecord, AnswerResult } from "../types/room.types.js";

export const ROUND_TIME_LIMIT_MS = 30_000;

export function calculateResponseTimeMs(
  startedAtMs: number,
  submittedAtMs: number,
): number {
  return Math.max(0, submittedAtMs - startedAtMs);
}

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

export function privateCorrectAnswer(question: QuestionContent): number | boolean | string {
  return question.type === "MCQ" ? question.content.correctIndex
    : question.type === "TRUE_FALSE" ? question.content.correctAnswer
      : correctAnswerLabel(question);
}

/* Atomically:
  1. Guard duplicate via EXISTS on SUBMISSION_KEY
  2. Accept server-graded correctness and verify the active round
  3. If correct: INCR CORRECT_COUNT_KEY → placement
  4. HINCRBY ROUND_KEY submissionCount — total submissions so far
  5. SET SUBMISSION_KEY to the complete scored record
 Returns: [isDuplicate (0|1), placement (0 if incorrect), totalSubmissions, isCorrect (0|1)]
*/
export const SUBMIT_ANSWER_LUA = `
local submissionKey   = KEYS[1]
local correctCountKey = KEYS[2]
local roundKey        = KEYS[3]
local endedKey        = KEYS[4]
local submissionJson  = ARGV[1]
local isCorrect      = tonumber(ARGV[2])
local questionId     = ARGV[3]
local roundNumber    = ARGV[4]

-- Reject duplicate
if redis.call('EXISTS', submissionKey) == 1 then
  return {1, 0, 0, 0}
end

if redis.call('HGET', roundKey, 'questionId') ~= questionId or
   redis.call('HGET', roundKey, 'roundNumber') ~= roundNumber or
   redis.call('EXISTS', endedKey) == 1 then
  return {2, 0, 0, 0}
end

local placement = 0
if isCorrect == 1 then
  placement = tonumber(redis.call('INCR', correctCountKey))
end

local totalSubmissions = tonumber(redis.call('HINCRBY', roundKey, 'submissionCount', 1))
local submission = cjson.decode(submissionJson)
submission.correct = isCorrect == 1
submission.placement = placement > 0 and placement or cjson.null
submission.pointsEarned = 0
if isCorrect == 1 then
  if placement == 1 then submission.pointsEarned = 100
  elseif placement == 2 then submission.pointsEarned = 75
  elseif placement == 3 then submission.pointsEarned = 50
  else submission.pointsEarned = 25 end
end
redis.call('SET', submissionKey, cjson.encode(submission))

return {0, placement, totalSubmissions, isCorrect}
`;

export async function submitAnswer(params: {
  gameId: string;
  roundNumber: number;
  questionId: string;
  playerId: string;
  answer: AnswerValue;
  responseTime: number;
  totalPlayers: number;
}): Promise<{ result: AnswerResult; allAnswered: boolean }> {
  const {
    gameId,
    roundNumber,
    questionId,
    playerId,
    answer,
    responseTime: _responseTime,
    totalPlayers,
  } = params;

  // Read active round state
  const raw = await redis.hgetall(ROUND_KEY(gameId));
  if (!raw || !raw.questionId) {
    throw new Error("No active round found");
  }

  // Validate this submission is for the current round (guards against stale events)
  if (raw.questionId !== questionId) {
    throw new Error("Stale submission for wrong round");
  }

  const question = QuestionContentSchema.parse({ type: raw.type, content: JSON.parse(raw.content ?? "null") });
  if (!isAnswerValueForQuestion(question, answer)) throw new Error("Answer type does not match question");
  const isCorrect = gradeAnswer(question, answer);
  const correctAnswer = privateCorrectAnswer(question);
  const startedAt = new Date(raw.startedAt!).getTime();
  const submissionTime = new Date();
  const submittedAt = submissionTime.toISOString();

  // Reject late submissions immediately — round timer has elapsed
  const responseTimeMs = calculateResponseTimeMs(
    startedAt,
    submissionTime.getTime(),
  );
  if (responseTimeMs > ROUND_TIME_LIMIT_MS) {
    throw new Error("Submission received after round time limit");
  }

  // Atomic Lua script records the server-graded result and placement.
  const submissionKey = SUBMISSION_KEY(gameId, roundNumber, playerId);
  const correctCountKey = CORRECT_COUNT_KEY(gameId, roundNumber);
  const roundKey = ROUND_KEY(gameId);

  // Build a base record; scoring fields are added after the Lua placement claim.
  const baseRecord = {
    playerId,
    roundNumber,
    questionId,
    answer,
    responseTimeMs,
    submittedAt,
    correctAnswer,
  };

  const result = (await redis.eval(
    SUBMIT_ANSWER_LUA,
    4,
    submissionKey,
    correctCountKey,
    roundKey,
    ROUND_ENDED_KEY(gameId, roundNumber),
    JSON.stringify(baseRecord),
    isCorrect ? "1" : "0",
    questionId,
    String(roundNumber),
  )) as [number, number, number, number];

  const [isDuplicate, rawPlacement, totalSubmissions, isCorrectFlag] = result;

  // Reject duplicate
  if (isDuplicate === 1) throw new Error("Answer already submitted");
  if (isDuplicate === 2) throw new Error("Stale submission for wrong round");

  // Use the correctness value recorded by Lua
  const correct = isCorrectFlag === 1;
  const placement = correct ? rawPlacement : null;
  const pointsEarned = calculatePoints(correct, placement);

  const answerResult: AnswerResult = {
    questionId,
    roundNumber,
    correctAnswer,
    correct,
    pointsEarned,
    placement,
  };

  return {
    result: answerResult,
    allAnswered: totalSubmissions >= totalPlayers,
  };
}

// Collect all SubmissionRecord values for a round from Redis.
// Used by round-end logic to build the round_finished payload.
// Returns submissions for all players; creates a null submission for players who didn't answer.
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
      // Player didn't submit an answer - create a null submission with 0 points
      submissions.push({
        playerId,
        roundNumber,
        questionId: "",
        answer: null,
        responseTimeMs: 0,
        submittedAt: new Date().toISOString(),
        correct: false,
        pointsEarned: 0,
        placement: null,
      });
    } else {
      const submission = JSON.parse(raw) as SubmissionRecord;
      submissions.push(submission);
    }
  }
  return submissions;
}
