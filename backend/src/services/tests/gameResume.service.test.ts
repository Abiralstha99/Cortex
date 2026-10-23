import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import { CORRECT_COUNT_KEY, GAME_KEY, ROUND_KEY, SUBMISSION_KEY } from "../../lib/redisKeys.js";
import { publishGamePhase, resumeGame } from "../gameResume.service.js";
import { registerGameHandlers } from "../../socket/gameHandler.js";
import type { Server, Socket } from "socket.io";

const gameId = "81818181-8181-4818-8818-818181818181";
const playerId = "member-1";
const gameKey = GAME_KEY(gameId);
const submissionKey = SUBMISSION_KEY(gameId, 1, playerId);
const roundKey = ROUND_KEY(gameId);

beforeEach(async () => {
  await redis.del(gameKey, roundKey, submissionKey, CORRECT_COUNT_KEY(gameId, 1));
  await redis.hset(gameKey, {
    gameId, status: "playing", numberOfRounds: "2", currentRound: "1",
    players: JSON.stringify([{ id: playerId, username: "Ada", ready: true, score: 0 }]),
    phaseVersion: "2", publicPhase: "question",
    publicPayload: JSON.stringify({
      roundNumber: 1, questionId: "q1", question: "Question?",
      type: "MCQ", options: ["A", "B", "C", "D"], startedAt: new Date().toISOString(),
    }),
  });
  await redis.hset(roundKey, { roundNumber: "1", questionId: "q1",
    type: "MCQ", content: JSON.stringify({ options: ["A", "B", "C", "D"], correctIndex: 2 }) });
});

after(async () => {
  await redis.del(gameKey, roundKey, submissionKey, CORRECT_COUNT_KEY(gameId, 1));
  await redis.quit();
});

describe("resumeGame Redis recovery", () => {
  it("acknowledges a scored answer privately without exposing its key to another player", async () => {
    const secondId = "member-2";
    const questionId = "77777777-7777-4777-8777-777777777777";
    await redis.hset(gameKey, {
      players: JSON.stringify([
        { id: playerId, username: "Ada", ready: true, score: 0 },
        { id: secondId, username: "Ben", ready: true, score: 0 },
      ]),
      publicPayload: JSON.stringify({ roundNumber: 1, questionId, question: "Question?", type: "MCQ", options: ["A", "B", "C", "D"], startedAt: new Date().toISOString() }),
    });
    await redis.hset(roundKey, { questionId, roundNumber: "1", startedAt: new Date().toISOString(), submissionCount: "0" });
    const handlers = new Map<string, (...args: unknown[]) => Promise<void>>();
    const privateEvents: unknown[] = [];
    const publicEvents: unknown[] = [];
    const socket = {
      data: { userId: playerId, username: "Ada" },
      on: (event: string, handler: (...args: unknown[]) => Promise<void>) => { handlers.set(event, handler); },
      emit: (_event: string, payload: unknown) => { privateEvents.push(payload); },
      to: () => ({ emit: (_event: string, payload: unknown) => { publicEvents.push(payload); } }),
    } as unknown as Socket;
    registerGameHandlers({} as Server, socket);
    const responses: unknown[] = [];
    const payload = { gameId, questionId, answer: 2, responseTime: 0 };
    await handlers.get("submit_answer")!(payload, (response: unknown) => { responses.push(response); });
    assert.equal((responses[0] as { ok: boolean }).ok, true);
    assert.equal((privateEvents[0] as { correctAnswer: number }).correctAnswer, 2);
    assert.equal(JSON.stringify(publicEvents).includes("correctAnswer"), false);
    const otherSnapshot = await resumeGame(gameId, secondId);
    assert.equal(otherSnapshot.ok, true);
    if (otherSnapshot.ok) assert.equal(otherSnapshot.snapshot.answerResult, null);
    await handlers.get("submit_answer")!(payload, (response: unknown) => { responses.push(response); });
    assert.equal((responses[1] as { ok: boolean }).ok, false);
    assert.equal(privateEvents.length, 2); // second event is the generic error, never a second answer result
    await redis.del(SUBMISSION_KEY(gameId, 1, secondId));
  });
  it("returns the member's unanswered question without the answer key", async () => {
    const result = await resumeGame(gameId, playerId);
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(result).includes("correctAnswer"), false);
    assert.equal(JSON.stringify(result).includes("correctIndex"), false);
  });

  it("increments the public phase version with its saved payload", async () => {
    const payload = await publishGamePhase(gameId, "round_results", {
      roundNumber: 1, correctAnswer: "C", leaderboard: [], submissions: [],
      isLastRound: false, nextRoundIn: 3000,
    });
    assert.equal(payload.phaseVersion, 3);
    const result = await resumeGame(gameId, playerId);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.snapshot.phaseVersion, 3);
      assert.equal(result.snapshot.phase, "round_results");
      assert.equal("correctAnswer" in result.snapshot.payload, false);
    }
  });

  it("refuses a nonmember", async () => {
    assert.deepEqual(await resumeGame(gameId, "stranger"), {
      ok: false, reason: "not_member",
    });
  });

  it("recovers the member's answer from its submission key", async () => {
    await redis.set(submissionKey, JSON.stringify({
      answer: 2, questionId: "q1", roundNumber: 1, correctAnswer: 2, correct: true, pointsEarned: 100, placement: 1,
    }));
    const result = await resumeGame(gameId, playerId);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.snapshot.myAnswer, 2);
      assert.equal(result.snapshot.answerResult?.correct, true);
      assert.equal(result.snapshot.answerResult?.correctAnswer, 2);
    }
  });

  it("never reads the next round's answer as feedback for this question", async () => {
    await redis.set(submissionKey, JSON.stringify({
      answer: 2, questionId: "q1", roundNumber: 1, correctAnswer: 2, correct: true, pointsEarned: 100, placement: 1,
    }));
    await redis.hset(roundKey, { roundNumber: "2", questionId: "q2",
      type: "MCQ", content: JSON.stringify({ options: ["Next A", "Next B", "Secret", "Next D"], correctIndex: 2 }) });
    assert.deepEqual(await resumeGame(gameId, playerId),
      { ok: false, reason: "temporary" });
  });

  it("joins only an authenticated member before acknowledging a snapshot", async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<void>>();
    const joined: string[] = [];
    const socket = {
      data: { userId: playerId, username: "Ada" },
      on: (event: string, handler: (...args: unknown[]) => Promise<void>) => {
        handlers.set(event, handler);
      },
      join: async (room: string) => { joined.push(room); },
    } as unknown as Socket;
    registerGameHandlers({} as Server, socket);
    let response: unknown;
    await handlers.get("resume_game")!({ gameId }, (value: unknown) => { response = value; });
    assert.deepEqual(joined, [`game:${gameId}`]);
    assert.equal((response as { ok: boolean }).ok, true);

    socket.data.userId = "stranger";
    await handlers.get("resume_game")!({ gameId }, (value: unknown) => { response = value; });
    assert.deepEqual(joined, [`game:${gameId}`]);
    assert.deepEqual(response, { ok: false, reason: "not_member" });
  });

  it("rejects an answer from a nonmember before creating a submission", async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<void>>();
    const emitted: { event: string; payload: unknown }[] = [];
    const socket = {
      data: { userId: "stranger", username: "Other" },
      on: (event: string, handler: (...args: unknown[]) => Promise<void>) => {
        handlers.set(event, handler);
      },
      emit: (event: string, payload: unknown) => { emitted.push({ event, payload }); },
    } as unknown as Socket;
    registerGameHandlers({} as Server, socket);
    await handlers.get("submit_answer")!({
      gameId, questionId: "77777777-7777-4777-8777-777777777777",
      answer: 1, responseTime: 500,
    });
    assert.equal(await redis.get(SUBMISSION_KEY(gameId, 1, "stranger")), null);
    assert.deepEqual(emitted, [{
      event: "error", payload: { message: "Player is not in this game" },
    }]);
  });
});
