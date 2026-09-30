import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enqueueGameFinish } from "../gameFinish.queue.js";

function queueWithState(state: string) {
  const calls: string[] = [];
  const queue = {
    getJob: async () => ({
      getState: async () => state,
      remove: async () => {
        calls.push("remove");
      },
    }),
    add: async (_name: string, _data: unknown, options: { jobId: string }) => {
      calls.push(`add:${options.jobId}`);
    },
  };
  return { calls, queue };
}

describe("enqueueGameFinish", () => {
  it("removes a terminal failed job and schedules a fresh attempt", async () => {
    const { calls, queue } = queueWithState("failed");

    await enqueueGameFinish(
      queue as never,
      "game-1",
      "2026-09-29T12:05:00.000Z",
    );

    assert.deepEqual(calls, ["remove", "add:game_game-1_finish"]);
  });

  it("keeps active and completed jobs deduplicated", async () => {
    for (const state of ["active", "completed"]) {
      const { calls, queue } = queueWithState(state);

      await enqueueGameFinish(
        queue as never,
        "game-1",
        "2026-09-29T12:05:00.000Z",
      );

      assert.deepEqual(calls, [], `${state} job should not be replaced`);
    }
  });
});
