import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

vi.mock("@/components/AccountMenu", () => ({
  default: () => <button type="button">Account</button>,
}));

afterEach(cleanup);

describe("authenticated navigation", () => {
  it("exposes only supported desktop destinations", () => {
    renderWithRouter(<AppSidebar />, "/dashboard");
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveTextContent("Home");
    expect(nav).toHaveTextContent("Create");
    expect(nav).toHaveTextContent("Join");
    expect(nav).not.toHaveTextContent("Discover");
  });

  it("gives mobile players the same working destinations and account action", () => {
    renderWithRouter(<MobileBottomNav />, "/game/create");
    expect(screen.getByRole("navigation", { name: "Mobile primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });
});
