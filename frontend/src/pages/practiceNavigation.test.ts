import { describe, expect, it } from "vitest";
import { resumePracticeIndex, samePracticeAnswer } from "./practiceNavigation";

describe("practice navigation", () => {
  it("opens the first unanswered question in saved order", () => {
    expect(resumePracticeIndex(["c", "a", "b"], ["a", "c"])).toBe(2);
    expect(resumePracticeIndex(["c", "a", "b"], ["a", "c", "b"])).toBe(-1);
  });
  it("recognizes changed and cleared answers", () => {
    expect(samePracticeAnswer({ answer: false }, { answer: false })).toBe(true);
    expect(samePracticeAnswer({ answer: "yes" }, null)).toBe(false);
    expect(samePracticeAnswer(null, null)).toBe(true);
  });
});
