import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PostGameReview from "./PostGameReview";

afterEach(cleanup);

it("shows loading, played order, unanswered rounds, and older missing sources", async () => {
  let resolve!: (value: Awaited<ReturnType<Parameters<typeof PostGameReview>[0]["loadReview"]>>) => void;
  const loadReview = vi.fn(() => new Promise<Awaited<ReturnType<Parameters<typeof PostGameReview>[0]["loadReview"]>>>((done) => { resolve = done; }));
  render(<PostGameReview loadReview={loadReview} />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading review...");
  resolve({ gameId: "game-1", rounds: [
    { roundNumber: 1, question: "Which city is the capital?", type: "MCQ", options: ["Paris", "Lyon"],
      playerAnswer: 1, correct: false, pointsEarned: 0, correctAnswer: "Paris",
      explanation: "Paris is France's capital.", sources: [{ chunkId: "chunk-1", quote: "Paris is the capital" }] },
    { roundNumber: 2, question: "Was the treaty signed?", type: "TRUE_FALSE", playerAnswer: null,
      correct: null, pointsEarned: 0, correctAnswer: "True", explanation: "The treaty was signed.", sources: [] },
  ] });
  expect(await screen.findByText("Which city is the capital?")).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
    "Which city is the capital?", "Was the treaty signed?",
  ]);
  expect(screen.getByText("Lyon", { exact: true })).toHaveClass("text-danger-foreground");
  expect(screen.getByText("No answer submitted")).toBeInTheDocument();
  expect(screen.getByText("Source excerpt unavailable for this quiz.")).toBeInTheDocument();
  expect(screen.getByText(/Paris is the capital/)).toBeInTheDocument();
});

it("shows an error and retries loading", async () => {
  const loadReview = vi.fn()
    .mockRejectedValueOnce(new Error("We couldn't load the review. Try again."))
    .mockResolvedValueOnce({ gameId: "game-1", rounds: [] });
  render(<PostGameReview loadReview={loadReview} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load the review");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(loadReview).toHaveBeenCalledTimes(2);
});
