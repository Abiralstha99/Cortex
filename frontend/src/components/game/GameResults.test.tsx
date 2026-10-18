import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { renderWithRouter } from "@/test/render";
import type { GameFinishedPayload } from "@/lib/api";
import GameResults from "./GameResults";

afterEach(cleanup);

it("shows every tied winner and recognizes each as a winner", () => {
  const gameResults: GameFinishedPayload = {
    finalLeaderboard: [
      { rank: 1, playerId: "player-a", username: "Alice", score: 300 },
      { rank: 1, playerId: "player-b", username: "Bob", score: 300 },
      { rank: 3, playerId: "player-c", username: "Chris", score: 100 },
    ],
    winners: [
      { rank: 1, playerId: "player-a", username: "Alice", score: 300 },
      { rank: 1, playerId: "player-b", username: "Bob", score: 300 },
    ],
  };

  renderWithRouter(
    <GameResults gameResults={gameResults} myPlayerId="player-b" loadReview={async () => ({ gameId: "game-1", rounds: [] })} />,
  );

  expect(screen.getByRole("heading", { name: "You won" })).toBeInTheDocument();
  expect(screen.getByText("Alice, Bob")).toBeInTheDocument();
  expect(screen.getByText("Alice, Bob").closest("p")).toHaveTextContent(
    /Winners: Alice, Bob,\s*300 pts/,
  );
});
