import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CreateWaitingGameSchema,
  DEFAULT_PLAYERS,
  DEFAULT_ROUNDS,
  WaitingGameIdParamsSchema,
} from "../game.js";

describe("CreateWaitingGameSchema", () => {
  it("accepts a room request without an existing quiz", () => {
    assert.deepEqual(CreateWaitingGameSchema.parse({}), {
      rounds: DEFAULT_ROUNDS,
      maxPlayers: DEFAULT_PLAYERS,
      isPublic: false,
    });
  });

  it("accepts a room request with an existing quiz", () => {
    const quizId = "d9428888-122b-11e1-b85c-61cd3cbb3210";

    assert.deepEqual(
      CreateWaitingGameSchema.parse({ quizId, rounds: 5, maxPlayers: 4 }),
      {
        quizId,
        rounds: 5,
        maxPlayers: 4,
        isPublic: false,
      },
    );
  });
 
  it("accepts isPublic true", () => {
    assert.equal(
      CreateWaitingGameSchema.parse({ isPublic: true }).isPublic,
      true,
    );
  });
});

describe("WaitingGameIdParamsSchema", () => {
  it("accepts UUID game IDs and rejects malformed IDs", () => {
    const gameId = "d9428888-122b-11e1-b85c-61cd3cbb3210";

    assert.deepEqual(WaitingGameIdParamsSchema.parse({ gameId }), { gameId });
    assert.equal(WaitingGameIdParamsSchema.safeParse({ gameId: "bad" }).success, false);
  });
});
