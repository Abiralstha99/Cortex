import { cleanup, render, screen } from "@testing-library/react";
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
      correct: true,
      pointsEarned: 120,
      placement: 1,
    },
    {
      playerId: "player-2",
      correct: false,
      pointsEarned: 90,
      placement: null,
    },
  ],
  leaderboard: [
    { rank: 1, playerId: "player-1", username: "Abiral", score: 1_000 },
    { rank: 2, playerId: "player-2", username: "Maya", score: 900 },
  ],
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

    expect(screen.getByText("+120")).toBeInTheDocument();
    expect(screen.queryByText("+90")).not.toBeInTheDocument();
    expect(screen.getByText("1000 pts")).toBeInTheDocument();
    expect(screen.getByText("900 pts")).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
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

    expect(
      screen.getByRole("heading", { name: "Your answer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No answer submitted")).toBeInTheDocument();
    expect(screen.queryByText("+90")).not.toBeInTheDocument();
    expect(screen.getByText("1000 pts")).toBeInTheDocument();
    expect(screen.getByText("900 pts")).toBeInTheDocument();
  });
});
