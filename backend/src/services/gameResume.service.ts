import type { AnswerValue } from "./questionAnswer.service.js";
import redis from "../lib/redis.js";
import { GAME_KEY, ROUND_KEY, SUBMISSION_KEY } from "../lib/redisKeys.js";
import type { AnswerResult, Player, SubmissionRecord } from "../types/room.types.js";

export type ResumeFailure = { ok: false; reason: "invalid_game" | "unavailable" | "not_member" | "temporary" };
export type GameSnapshot = {
  gameId: string;
  numberOfRounds: number;
  phaseVersion: number;
  phase: "countdown" | "question" | "round_results" | "game_finished";
  payload: Record<string, unknown>;
  myAnswer: AnswerValue | null;
  answerResult: AnswerResult | null;
};
export type ResumeResponse = { ok: true; snapshot: GameSnapshot } | ResumeFailure;

export function isGameMember(game: Record<string, string>, playerId: string): boolean {
  return (game.status === "playing" || game.status === "finished") &&
    !!game.players && (JSON.parse(game.players) as Player[])
      .some((player) => player.id === playerId);
}

// Keep the public phase and its version in one atomic Redis operation. A client
// can then discard broadcasts older than the snapshot it just received.
const PUBLISH_PHASE_LUA = `
local version = redis.call('HINCRBY', KEYS[1], 'phaseVersion', 1)
redis.call('HSET', KEYS[1], 'publicPhase', ARGV[1], 'publicPayload', ARGV[2])
return version
`;

export async function publishGamePhase<T extends object>(
  gameId: string,
  phase: GameSnapshot["phase"],
  payload: T,
): Promise<T & { phaseVersion: number }> {
  const phaseVersion = Number(await redis.eval(
    PUBLISH_PHASE_LUA, 1, GAME_KEY(gameId), phase, JSON.stringify(payload),
  ));
  return { ...payload, phaseVersion };
}

export function buildGameSnapshot(
  game: Record<string, string>,
  playerId: string,
  submissionRaw: string | null,
): ResumeResponse {
  if (!game.players || (game.status !== "playing" && game.status !== "finished")) {
    return { ok: false, reason: "unavailable" };
  }
  if (!isGameMember(game, playerId)) {
    return { ok: false, reason: "not_member" };
  }
  if (!game.publicPhase || !game.publicPayload) {
    return { ok: false, reason: game.status === "playing" ? "temporary" : "unavailable" };
  }
  const phase = game.publicPhase as GameSnapshot["phase"];
  if (!["countdown", "question", "round_results", "game_finished"].includes(phase)) {
    return { ok: false, reason: "unavailable" };
  }
  const payload = JSON.parse(game.publicPayload) as Record<string, unknown>;
  delete payload.correctAnswer;
  delete payload.explanation;
  delete payload.sources;
  // Public payloads are created at broadcast time and contain no answer key
  // while the question is open.
  const submission = submissionRaw ? JSON.parse(submissionRaw) as SubmissionRecord : null;
  // Reject malformed records left by older deployments.
  if (phase === "question" && submission &&
      (typeof submission.correct !== "boolean" ||
       typeof submission.pointsEarned !== "number" ||
       submission.correctAnswer === undefined ||
       submission.questionId !== payload.questionId ||
       submission.roundNumber !== payload.roundNumber)) {
    return { ok: false, reason: "temporary" };
  }
  const answerResult: AnswerResult | null = submission && typeof submission.correct === "boolean"
    ? {
        questionId: submission.questionId,
        roundNumber: submission.roundNumber,
        correctAnswer: submission.correctAnswer!,
        correct: submission.correct,
        pointsEarned: submission.pointsEarned,
        placement: submission.placement,
      }
    : null;
  return {
    ok: true,
    snapshot: {
      gameId: game.gameId ?? "",
      numberOfRounds: Number(game.numberOfRounds),
      phaseVersion: Number(game.phaseVersion ?? 0),
      phase,
      payload,
      myAnswer: phase === "question" && submission ? submission.answer : null,
      answerResult: phase === "question" ? answerResult : null,
    },
  };
}

export async function resumeGame(gameId: string, playerId: string): Promise<ResumeResponse> {
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game?.players) return { ok: false, reason: "unavailable" };
  if (!isGameMember(game, playerId)) return { ok: false, reason: "not_member" };
  const roundNumber = Number(game.currentRound ?? 0);
  const submissionRaw = roundNumber > 0
    ? await redis.get(SUBMISSION_KEY(gameId, roundNumber, playerId)) : null;
  if (submissionRaw && game.publicPhase === "question") {
    const round = await redis.hgetall(ROUND_KEY(gameId));
    const publicQuestion = JSON.parse(game.publicPayload ?? "{}") as {
      questionId: string; roundNumber: number;
    };
    if (round.questionId !== publicQuestion.questionId ||
        Number(round.roundNumber) !== publicQuestion.roundNumber) {
      return { ok: false, reason: "temporary" };
    }
  }
  return buildGameSnapshot(game, playerId, submissionRaw);
}
