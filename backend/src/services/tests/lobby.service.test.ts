import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import redis from "../../lib/redis.js";
import {
  GAME_KEY,
  ROOM_CODE_KEY,
} from "../../lib/redisKeys.js";
import { leaveWaitingGame } from "../lobby.service.js";

const GAME_ID = "33333333-3333-3333-3333-333333333333";
const ROOM_CODE = "ABC123";

async function seedWaitingRoom(isPublic: "0" | "1") {
  await redis.set(ROOM_CODE_KEY(ROOM_CODE), GAME_ID);
  await redis.hset(GAME_KEY(GAME_ID), {
    gameId: GAME_ID,
    roomCode: ROOM_CODE,
    players: JSON.stringify([
      { id: "host-1", username: "alice", ready: false, score: 0 },
    ]),
    status: "waiting",
    hostId: "host-1",
    isPublic,
    numberOfRounds: "5",
    maxPlayers: "8",
    createdAt: new Date().toISOString(),
    quizId: "",
    quizGenStatus: "ready",
    quizGenJobId: "",
    quizGenError: "",
  });
}

beforeEach(async () => {
  await redis.del(GAME_KEY(GAME_ID), ROOM_CODE_KEY(ROOM_CODE));
});

after(async () => {
  await redis.del(GAME_KEY(GAME_ID), ROOM_CODE_KEY(ROOM_CODE));
  await redis.quit();
});

describe("leaveWaitingGame wasPublic", () => {
  it("returns wasPublic when the last player leaves a public room", async () => {
    await seedWaitingRoom("1");

    const result = await leaveWaitingGame(ROOM_CODE, "host-1");

    assert.deepEqual(result, {
      game: null,
      leftPlayerId: "host-1",
      gameId: GAME_ID,
      wasPublic: true,
    });
  });

  it("returns wasPublic false when the last player leaves a private room", async () => {
    await seedWaitingRoom("0");

    const result = await leaveWaitingGame(ROOM_CODE, "host-1");

    assert.deepEqual(result, {
      game: null,
      leftPlayerId: "host-1",
      gameId: GAME_ID,
      wasPublic: false,
    });
  });
});
