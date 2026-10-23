import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import type { Server } from "socket.io";
import redis from "../../lib/redis.js";
import { gameFinishQueue } from "../../lib/queue.js";
import { GAME_KEY, ROUND_ENDED_KEY, ROUND_KEY, SUBMISSION_KEY } from "../../lib/redisKeys.js";
import { GAME_FINISH_JOB_ID } from "../gameFinish.queue.js";
import { BETWEEN_ROUND_DELAY_MS, endRound } from "../roundEnd.service.js";

const gameId = randomUUID();
const first = randomUUID();
const second = randomUUID();
const questionId = randomUUID();
const feedbackGameIds: string[] = [];

after(async () => {
  await (await gameFinishQueue.getJob(GAME_FINISH_JOB_ID(gameId)))?.remove();
  await redis.del(GAME_KEY(gameId), ROUND_KEY(gameId), ROUND_ENDED_KEY(gameId, 1),
    SUBMISSION_KEY(gameId, 1, first), SUBMISSION_KEY(gameId, 1, second));
  for (const id of feedbackGameIds) {
    await (await gameFinishQueue.getJob(GAME_FINISH_JOB_ID(id)))?.remove();
    await redis.del(GAME_KEY(id), ROUND_KEY(id), ROUND_ENDED_KEY(id, 1),
      SUBMISSION_KEY(id, 1, first), SUBMISSION_KEY(id, 1, second));
  }
  await gameFinishQueue.close();
  redis.disconnect();
});

describe("round reveal", () => {
  for (const answeredCount of [1, 2]) {
    it(`keeps the question visible for a recent answer when ${answeredCount} player(s) submitted`, async () => {
      const id = randomUUID();
      feedbackGameIds.push(id);
      await redis.hset(GAME_KEY(id), {
        gameId: id, status: "playing", numberOfRounds: "1", currentRound: "1",
        players: JSON.stringify([
          { id: first, username: "Ada", ready: true, score: 0 },
          { id: second, username: "Ben", ready: true, score: 0 },
        ]),
        publicPhase: "question", publicPayload: "{}", phaseVersion: "2",
      });
      await redis.hset(ROUND_KEY(id), { roundNumber: "1", questionId });
      for (const playerId of [first, second].slice(0, answeredCount)) {
        await redis.set(SUBMISSION_KEY(id, 1, playerId), JSON.stringify({
          playerId, roundNumber: 1, questionId, answer: 0, correct: true,
          pointsEarned: 100, placement: 1, responseTimeMs: 200,
          submittedAt: new Date().toISOString(), correctAnswer: 0,
        }));
      }
      const events: string[] = [];
      const io = { to: () => ({ emit: (name: string) => { events.push(name); } }) } as unknown as Server;
      const closing = endRound(id, 1, io);
      await delay(100);
      assert.deepEqual(events, []);
      assert.equal(await redis.hget(GAME_KEY(id), "publicPhase"), "question");
      await closing;
      assert.deepEqual(events, ["round_finished"]);
    });
  }

  it("publishes once when timer and last-answer paths close together", async () => {
    await redis.hset(GAME_KEY(gameId), {
      gameId, status: "playing", numberOfRounds: "1", currentRound: "1",
      players: JSON.stringify([
        { id: first, username: "Ada", ready: true, score: 0 },
        { id: second, username: "Ben", ready: true, score: 0 },
      ]),
      publicPhase: "question", publicPayload: "{}", phaseVersion: "2",
    });
    await redis.hset(ROUND_KEY(gameId), { roundNumber: "1", questionId });
    await redis.set(SUBMISSION_KEY(gameId, 1, first), JSON.stringify({
      playerId: first, roundNumber: 1, questionId, answer: 0, correct: true,
      pointsEarned: 100, placement: 1, responseTimeMs: 200,
      submittedAt: new Date(Date.now() - 3_000).toISOString(), correctAnswer: 0,
    }));
    const events: Array<{ name: string; payload: Record<string, unknown> }> = [];
    const io = { to: () => ({ emit: (name: string, payload: Record<string, unknown>) => { events.push({ name, payload }); } }) } as unknown as Server;
    const before = Date.now();
    await Promise.all([endRound(gameId, 1, io), endRound(gameId, 1, io)]);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.name, "round_finished");
    const payload = events[0]!.payload;
    assert.equal((payload.revealEndsAt as number) - before >= BETWEEN_ROUND_DELAY_MS, true);
    assert.equal((payload.revealEndsAt as number) - Date.now() <= BETWEEN_ROUND_DELAY_MS, true);
    assert.deepEqual((payload.previousLeaderboard as Array<{ score: number }>).map((entry) => entry.score), [0, 0]);
    assert.deepEqual((payload.leaderboard as Array<{ score: number }>).map((entry) => entry.score), [100, 0]);
    assert.deepEqual((payload.submissions as Array<{ submitted: boolean }>).map((entry) => entry.submitted), [true, false]);
    assert.equal(JSON.stringify(payload).includes("correctAnswer"), false);
    const job = await gameFinishQueue.getJob(GAME_FINISH_JOB_ID(gameId));
    assert.equal(!!job, true);
    assert.equal(await job?.getState(), "delayed");
  });
});
