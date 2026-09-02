import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LiveRoomCard from "./LiveRoomCard";

const room = {
  gameId: "game-1",
  roomCode: "ABC123",
  hostId: "host-1",
  hostUsername: "Maya",
  playerCount: 3,
  maxPlayers: 8,
  numberOfRounds: 10,
  quizGenStatus: "ready" as const,
  createdAt: "2026-09-01T12:00:00.000Z",
};

afterEach(cleanup);

describe("LiveRoomCard", () => {
  it("joins with the existing room code", async () => {
    const onJoin = vi.fn();
    render(<LiveRoomCard room={room} onJoin={onJoin} />);

    await userEvent.click(screen.getByRole("button", { name: "Join ABC123" }));

    expect(onJoin).toHaveBeenCalledWith("ABC123");
  });

  it("disables a full room", () => {
    render(<LiveRoomCard room={{ ...room, playerCount: 8 }} onJoin={vi.fn()} />);

    expect(screen.getByRole("button", { name: "ABC123 is full" })).toBeDisabled();
  });

  it("labels generation status without relying on color", () => {
    render(
      <LiveRoomCard
        room={{ ...room, quizGenStatus: "processing" }}
        onJoin={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Generation: Generating questions..."),
    ).toBeVisible();
  });

  it("keeps room metadata in one card surface", () => {
    render(<LiveRoomCard room={room} onJoin={vi.fn()} />);

    const card = screen.getByRole("listitem");

    expect(card).toHaveClass("min-h-56");
    expect(within(card).getByText("3 / 8 players")).toBeVisible();
    expect(within(card).getByText("10 questions")).toBeVisible();
    expect(within(card).getByText("Generation: Quiz ready")).toBeVisible();
    expect(card.querySelector("dl")).not.toBeInTheDocument();
  });
});
