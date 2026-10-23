import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import QuizPickerList from "./QuizPickerList";

afterEach(cleanup);

it("retries a failed saved-quiz load inline", () => {
  const onRetry = vi.fn();
  render(<QuizPickerList quizzes={[]} isLoading={false} error={new Error("offline")} selectedId={null} onSelect={vi.fn()} onRetry={onRetry} />);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
