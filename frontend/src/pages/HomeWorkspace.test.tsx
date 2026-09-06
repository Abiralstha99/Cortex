import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "@/test/render";
import HomeWorkspace from "./HomeWorkspace";

vi.mock("@clerk/react", () => ({
  useUser: () => ({ user: undefined }),
}));

afterEach(cleanup);

describe("HomeWorkspace shell", () => {
  it("exposes fluent-dark theme and brand chrome", () => {
    renderWithRouter(<HomeWorkspace />);

    expect(document.querySelector('[data-theme="fluent-dark"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Cortex." })).toBeInTheDocument();
  });
});

