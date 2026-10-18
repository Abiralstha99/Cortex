import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePoints,
  calculateResponseTimeMs,
} from "../answer.service.js";
import redis from "../../lib/redis.js";

// answer.service imports the shared Redis client; quit so the test process can exit.
after(async () => {
  await redis.quit();
});

describe("calculatePoints", () => {
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

describe("calculateResponseTimeMs", () => {
  it("measures elapsed time using server timestamps", () => {
    assert.equal(calculateResponseTimeMs(1_000, 1_825), 825);
  });

  it("does not return negative elapsed time", () => {
    assert.equal(calculateResponseTimeMs(2_000, 1_000), 0);
  });
});
