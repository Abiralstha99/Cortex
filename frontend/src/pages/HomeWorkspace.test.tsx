import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "@/test/render";
import HomeWorkspace from "./HomeWorkspace";

vi.mock("@clerk/react", () => {
  return {
    useUser: () => ({ user: undefined }),
    useClerk: () => ({ openSignIn: () => {} }),
    useAuth: () => ({ isLoaded: true, isSignedIn: false }),
  };
});

vi.mock("@/components/home/JoinRail", () => ({
  default: () => <div data-testid="join-game-panel">Join a game</div>,
}));

vi.mock("@/components/home/LiveRoomRows", () => ({
  default: () => <div data-testid="public-rooms">Public rooms</div>,
}));

afterEach(cleanup);

describe("HomeWorkspace shell", () => {
  it("exposes fluent-dark theme and brand chrome", () => {
    renderWithRouter(<HomeWorkspace />);

    expect(document.querySelector('[data-theme="fluent-dark"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Cortex" })).toBeInTheDocument();
  });

  it("places public rooms below the join game panel", () => {
    renderWithRouter(<HomeWorkspace />);

    const main = screen.getByRole("main");
    const joinPanel = screen.getByTestId("join-game-panel");
    const publicRooms = screen.getByTestId("public-rooms");

    expect(main.compareDocumentPosition(publicRooms) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(joinPanel.compareDocumentPosition(publicRooms) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
