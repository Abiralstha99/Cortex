import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Game from "./Game";
import { useGameStore } from "@/stores/gameStore";
import { useLobbyStore } from "@/stores/lobbyStore";

const gameSocketState = vi.hoisted(() => ({
  connected: false,
  connectionReady: false,
  connectionState: "reconnecting" as
    | "connected"
    | "reconnecting"
    | "offline",
  recoveryState: "ready" as "connecting" | "ready" | "unavailable",
  recoveryReason: null as string | null,
  submitAnswer: vi.fn(),
  retryConnection: vi.fn(),
}));

vi.mock("@/hooks/useGameSocket", () => ({
  useGameSocket: () => gameSocketState,
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ id: "player-1" }),
}));

function gameRoute() {
  return (
    <MemoryRouter initialEntries={["/game/game-1"]}>
      <Routes>
        <Route path="/game/:gameId" element={<Game />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Game connection feedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLobbyStore.getState().reset();
    useLobbyStore.setState({ gameId: "game-1", numberOfRounds: 10 });
    useGameStore.getState().reset();
    gameSocketState.connected = false;
    gameSocketState.connectionReady = false;
    gameSocketState.connectionState = "reconnecting";
    gameSocketState.recoveryState = "ready";
    gameSocketState.recoveryReason = null;
    gameSocketState.submitAnswer.mockClear();
    gameSocketState.retryConnection.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not report a lost connection before socket hydration", () => {
    const view = render(gameRoute());

    expect(document.querySelector('[data-theme="editorial-app"]')).not.toBeNull();

    expect(
      screen.queryByText("Connection lost. Reconnecting..."),
    ).not.toBeInTheDocument();

    gameSocketState.connectionReady = true;
    gameSocketState.connected = true;
    gameSocketState.connectionState = "connected";
    view.rerender(gameRoute());
    act(() => vi.advanceTimersByTime(0));

    expect(screen.queryByText("Reconnected.")).not.toBeInTheDocument();
  });

  it("announces a retry reconnection for exactly two seconds", () => {
    gameSocketState.connectionReady = true;
    gameSocketState.connectionState = "offline";
    const view = render(gameRoute());

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(gameSocketState.retryConnection).toHaveBeenCalledOnce();

    gameSocketState.connectionState = "reconnecting";
    view.rerender(gameRoute());
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Connection lost. Reconnecting...",
    );

    gameSocketState.connected = true;
    gameSocketState.connectionState = "connected";
    view.rerender(gameRoute());
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole("status")).toHaveTextContent("Reconnected.");

    act(() => vi.advanceTimersByTime(1_999));
    expect(screen.getByRole("status")).toHaveTextContent("Reconnected.");

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Reconnected.")).not.toBeInTheDocument();
  });

  it("shows recovery while stores are empty and a return action after a definitive failure", () => {
    useLobbyStore.getState().reset();
    gameSocketState.recoveryState = "connecting";
    const view = render(gameRoute());
    expect(screen.getByText("Connecting to game...")).toBeInTheDocument();
    expect(screen.queryByText("Return home")).not.toBeInTheDocument();

    gameSocketState.recoveryState = "unavailable";
    gameSocketState.recoveryReason = "not_member";
    view.rerender(gameRoute());
    expect(screen.getByText("You're not a player in this game.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument();
  });
});
