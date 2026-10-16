import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import PageShell from "./PageShell";

vi.mock("./AppSidebar", () => ({
  default: () => <div data-testid="desktop-navigation" />,
}));

vi.mock("@/components/AppHeader", () => ({
  default: () => <div data-testid="app-header" />,
}));

vi.mock("./MobileBottomNav", () => ({
  default: () => <div data-testid="mobile-navigation" />,
}));

afterEach(cleanup);

describe("PageShell", () => {
  it("removes dashboard chrome during a live game", () => {
    renderWithRouter(<PageShell>Live game</PageShell>, "/game/game-123");

    expect(screen.getByText("Live game")).toBeInTheDocument();
    expect(document.querySelector('[data-theme="editorial-app"]')).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-navigation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-navigation")).not.toBeInTheDocument();
  });

  it("keeps dashboard chrome on authenticated setup routes", () => {
    renderWithRouter(<PageShell>Dashboard</PageShell>, "/dashboard");

    expect(screen.getByTestId("desktop-navigation")).toBeInTheDocument();
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-navigation")).toBeInTheDocument();
    expect(document.querySelector('[data-theme="editorial-app"]')).toBeInTheDocument();
  });
});
