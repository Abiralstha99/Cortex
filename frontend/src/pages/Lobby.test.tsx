import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Lobby from "./Lobby";

const lobbyState = vi.hoisted(() => ({
  players: [{ id: "host-1", username: "Maya", ready: true }],
  hostId: "host-1",
  gameId: "game-1",
  numberOfRounds: 10,
  maxPlayers: 8,
  quizId: "quiz-1",
  quizGenStatus: "ready" as const,
  status: "in_lobby" as "in_lobby" | "joining" | "error",
  toast: null,
  attemptStart: vi.fn(() => true),
  setToast: vi.fn(),
}));
const socketState = vi.hoisted(() => ({ connected: true, toggleReady: vi.fn(), startGame: vi.fn(), leave: vi.fn() }));

vi.mock("@/components/layout/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/lobby/PlayerCard", () => ({
  default: ({ player }: { player: { username: string } }) => <li>{player.username}</li>,
}));

vi.mock("@/hooks/useLobbySocket", () => ({
  useLobbySocket: () => socketState,
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ id: "host-1" }),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ getToken: vi.fn() }),
}));

vi.mock("@/stores/lobbyStore", () => ({
  useLobbyStore: (selector: (state: typeof lobbyState) => unknown) =>
    selector(lobbyState),
}));

describe("Lobby", () => {
  afterEach(() => { cleanup(); lobbyState.status = "in_lobby"; socketState.connected = true; });
  it("keeps room status outside the Players workspace", () => {
    render(
      <MemoryRouter initialEntries={["/lobby/ABC123"]}>
        <Lobby />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Players" })).toBeInTheDocument();
    const quizStatus = screen.getByText("Ready to play").parentElement?.parentElement ?? null;
    expect(quizStatus).toBeInTheDocument();
    expect(quizStatus?.querySelector(".rounded-full")).toBeInTheDocument();
    expect(quizStatus?.querySelector(".bg-success-soft")).not.toBeInTheDocument();
    const playersHeading = screen.getByRole("heading", { name: "Players" });
    expect(playersHeading.parentElement?.parentElement ?? null).not.toContainElement(quizStatus);
    expect(screen.getByRole("button", { name: "You're ready" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start game/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Start the game" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your readiness" })).not.toBeInTheDocument();
  });

  it("keeps readiness unavailable until joined and connected", () => {
    lobbyState.status = "joining";
    const view = render(<MemoryRouter initialEntries={["/lobby/ABC123"]}><Lobby /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "You're ready" })).toBeDisabled();
    expect(screen.getByText(/Joining room before you can mark ready/)).toBeInTheDocument();

    lobbyState.status = "in_lobby";
    socketState.connected = false;
    view.rerender(<MemoryRouter initialEntries={["/lobby/ABC123"]}><Lobby /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "You're ready" })).toBeDisabled();
    expect(screen.getByText("Connection lost. Reconnecting...")).toBeInTheDocument();

    socketState.connected = true;
    view.rerender(<MemoryRouter initialEntries={["/lobby/ABC123"]}><Lobby /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "You're ready" })).toBeEnabled();
  });
});
