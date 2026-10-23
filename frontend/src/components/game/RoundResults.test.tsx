import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoundFinishedPayload } from "@/lib/api";
import RoundResults from "./RoundResults";

afterEach(cleanup);

const motionPreference = vi.hoisted(() => ({ reduce: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => motionPreference.reduce,
  };
});

const roundResults: RoundFinishedPayload = {
  roundNumber: 2,
  submissions: [
    {
      playerId: "player-1",
      submitted: true,
      correct: true,
      pointsEarned: 120,
      placement: 1,
    },
    {
      playerId: "player-2",
      submitted: true,
      correct: false,
      pointsEarned: 90,
      placement: null,
    },
  ],
  leaderboard: [
    { rank: 1, playerId: "player-1", username: "Abiral", score: 1_000 },
    { rank: 2, playerId: "player-2", username: "Maya", score: 900 },
  ],
  previousLeaderboard: [
    { rank: 1, playerId: "player-2", username: "Maya", score: 900 },
    { rank: 2, playerId: "player-1", username: "Abiral", score: 880 },
  ],
  revealEndsAt: Date.now() + 4500,
  isLastRound: true,
  nextRoundIn: 0,
};

describe.each([
  ["full motion", false],
  ["reduced motion", true],
])("RoundResults with %s", (_label, reduce) => {
  beforeEach(() => {
    motionPreference.reduce = reduce;
  });

  it("shows only the current submission while retaining every leaderboard row", () => {
    render(
      <RoundResults roundResults={roundResults} myPlayerId="player-1" />,
    );

    expect(screen.getByText(/Correct · \+120 pts/)).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
    if (reduce) {
      expect(screen.getByText("1000 pts")).toBeInTheDocument();
      expect(screen.getByText("900 pts")).toBeInTheDocument();
      expect(screen.getByLabelText("Up 1 ranks")).toBeInTheDocument();
    } else {
      expect(screen.getByText("880 pts")).toBeInTheDocument();
      expect(screen.queryByLabelText("Up 1 ranks")).not.toBeInTheDocument();
    }
  });

  it("shows an explicit timeout state without exposing another player's submission", () => {
    render(
      <RoundResults
        roundResults={{
          ...roundResults,
          submissions: [roundResults.submissions[1]],
        }}
        myPlayerId="player-1"
      />,
    );

    expect(screen.getByText("No answer submitted")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });
});

it("moves rows to final ranks during the reveal", () => {
  motionPreference.reduce = false;
  vi.useFakeTimers();
  try {
    render(<RoundResults roundResults={{ ...roundResults, revealEndsAt: Date.now() + 4500 }} myPlayerId="player-1" />);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Maya");
    act(() => vi.advanceTimersByTime(1400));
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Abiral");
    expect(screen.queryByLabelText("Up 1 ranks")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByLabelText("Up 1 ranks")).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

it("shows final values immediately on a late reconnect", () => {
  motionPreference.reduce = false;
  render(<RoundResults roundResults={{ ...roundResults, revealEndsAt: Date.now() - 100 }} myPlayerId="player-1" />);
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Abiral");
  expect(screen.getByText("1000 pts")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Saving final results");
});

it("shows final standings when a round payload lacks reveal fields", () => {
  motionPreference.reduce = false;
  const legacyResults = { ...roundResults, previousLeaderboard: undefined, revealEndsAt: undefined };
  render(<RoundResults roundResults={legacyResults} myPlayerId="player-1" />);

  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Abiral");
  expect(screen.getByText("1000 pts")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Saving final results");
});
