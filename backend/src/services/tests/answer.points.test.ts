import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePoints } from "../answer.service.js";
import redis from "../../lib/redis.js";

// answer.service imports the shared Redis client; quit so the test process can exit.
after(async () => {
  await redis.quit();
});

describe("calculatePoints (MCQ index grading payouts)", () => {
  it("returns 0 when incorrect regardless of placement", () => {
    assert.equal(calculatePoints(false, 1), 0);
    assert.equal(calculatePoints(false, null), 0);
  });

  it("maps placement to fixed points when correct", () => {
    assert.equal(calculatePoints(true, 1), 100);
    assert.equal(calculatePoints(true, 2), 75);
    assert.equal(calculatePoints(true, 3), 50);
    assert.equal(calculatePoints(true, 4), 25);
    assert.equal(calculatePoints(true, 99), 25);
    assert.equal(calculatePoints(true, null), 25);
  });
});

describe("index equality grading contract", () => {
  it("grades by integer equality 0-3 (mirrors Lua isCorrect)", () => {
    const correctIndex = 2;
    const grade = (answerIndex: number) => answerIndex === correctIndex;
    assert.equal(grade(2), true);
    assert.equal(grade(0), false);
    assert.equal(grade(3), false);
  });
});
