import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Lobby from "./Lobby";

const lobbyState = vi.hoisted(() => ({
  players: [{ id: "host-1", username: "Maya", ready: true }],
  hostId: "host-1",
  gameId: "game-1",
  numberOfRounds: 10,
  maxPlayers: 8,
  quizId: "quiz-1",
  quizGenStatus: "ready" as const,
  status: "in_lobby" as const,
  toast: null,
  attemptStart: vi.fn(() => true),
  setToast: vi.fn(),
}));

vi.mock("@/components/layout/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/lobby/QuizGenerationPanel", () => ({
  default: () => <section>Quiz generation status</section>,
}));

vi.mock("@/components/lobby/PlayerCard", () => ({
  default: ({ player }: { player: { username: string } }) => <li>{player.username}</li>,
}));

vi.mock("@/hooks/useLobbySocket", () => ({
  useLobbySocket: () => ({
    connected: true,
    toggleReady: vi.fn(),
    startGame: vi.fn(),
    leave: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ id: "host-1" }),
}));

vi.mock("@/stores/lobbyStore", () => ({
  useLobbyStore: (selector: (state: typeof lobbyState) => unknown) =>
    selector(lobbyState),
}));

describe("Lobby", () => {
  it("renders host start controls before readiness controls", () => {
    render(
      <MemoryRouter initialEntries={["/lobby/ABC123"]}>
        <Lobby />
      </MemoryRouter>,
    );

    const startHeading = screen.getByRole("heading", { name: "Start the game" });
    const readinessHeading = screen.getByRole("heading", {
      name: "Your readiness",
    });

    expect(
      startHeading.compareDocumentPosition(readinessHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
