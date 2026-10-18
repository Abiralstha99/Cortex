import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HomeWorkspace shell", () => {
  it("exposes the editorial landing theme and brand chrome", () => {
    renderWithRouter(<HomeWorkspace />);

    expect(document.querySelector('[data-theme="editorial-landing"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Cortex" })).toHaveLength(2);
  });

  it("keeps create and join entry points on the landing page", () => {
    renderWithRouter(<HomeWorkspace />);

    expect(document.querySelector("#create")).not.toBeNull();
    expect(document.querySelector("#join")).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Create a quiz" })[0]).toHaveAttribute("href", "#create");
    expect(screen.getAllByRole("link", { name: "Join a game" })[0]).toHaveAttribute("href", "#join");
  });

  it("scrolls to the join section without adding a URL hash", () => {
    renderWithRouter(<HomeWorkspace />);
    const scrollIntoView = vi.fn();
    document.querySelector("#join")!.scrollIntoView = scrollIntoView;
    const originalUrl = window.location.href;

    const followed = fireEvent.click(screen.getAllByRole("link", { name: "Join a game" })[0]);

    expect(followed).toBe(false);
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(window.location.href).toBe(originalUrl);
  });

  it("keeps the PLAY orbital story readable without WebGL", () => {
    renderWithRouter(<HomeWorkspace />);

    const heroArt = document.querySelector(".landing-hero-art");
    expect(heroArt).not.toBeNull();
    expect(within(heroArt as HTMLElement).getByRole("img", {
      name: /play connects the host, friends, questions, and scores/i,
    })).toBeInTheDocument();
    for (const label of ["HOST", "FRIENDS", "QUESTIONS", "SCORES", "PLAY"]) {
      expect(within(heroArt as HTMLElement).getByText(label)).toBeInTheDocument();
    }
  });

  it("keeps every animated heading accessible within a line mask", () => {
    renderWithRouter(<HomeWorkspace />);

    for (const name of [
      /Your notes\. Game night/i,
      /From notes to game night/i,
      /Learning sticks better when everyone plays/i,
      /Ready to make some noise/i,
      /The best study session is the one you play/i,
    ]) {
      const heading = screen.getByRole("heading", { name });
      expect(heading.querySelectorAll(".landing-line-mask").length).toBeGreaterThan(0);
    }
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
