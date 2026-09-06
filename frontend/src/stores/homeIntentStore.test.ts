import { beforeEach, describe, expect, it } from "vitest";
import {
  clearFileHandoffCache,
  consumePendingFileForCreate,
  useHomeIntentStore,
} from "./homeIntentStore";

beforeEach(() => {
  useHomeIntentStore.getState().clear();
  clearFileHandoffCache();
});

describe("homeIntentStore", () => {
  it("takePendingFile returns once then clears", () => {
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    expect(useHomeIntentStore.getState().takePendingFile()).toBe(file);
    expect(useHomeIntentStore.getState().takePendingFile()).toBeNull();
  });

  it("takePendingJoinCode is idempotent under double take", () => {
    useHomeIntentStore.getState().setPendingJoinCode("AB12C3");
    expect(useHomeIntentStore.getState().takePendingJoinCode()).toBe("AB12C3");
    expect(useHomeIntentStore.getState().takePendingJoinCode()).toBeNull();
  });

  it("create resume request flag behaves like a take-once", () => {
    // initially false
    expect(useHomeIntentStore.getState().takeCreateResume()).toBe(false);
    useHomeIntentStore.getState().requestCreateResume();
    expect(useHomeIntentStore.getState().takeCreateResume()).toBe(true);
    // subsequent reads reset it
    expect(useHomeIntentStore.getState().takeCreateResume()).toBe(false);
  });

  it("consumePendingFileForCreate caches across repeated reads", () => {
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    expect(consumePendingFileForCreate()).toBe(file);
    expect(consumePendingFileForCreate()).toBe(file);
    expect(useHomeIntentStore.getState().takePendingFile()).toBeNull();
  });

  it("clearFileHandoffCache allows a fresh consume", () => {
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    expect(consumePendingFileForCreate()).toBe(file);
    clearFileHandoffCache();
    expect(consumePendingFileForCreate()).toBeNull();
  });
});
