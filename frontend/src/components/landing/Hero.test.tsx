import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "@/test/render";
import { Hero } from "./Hero";

afterEach(cleanup);

describe("Hero", () => {
  it("normalizes a valid room code before joining", async () => {
    const user = userEvent.setup();
    const onJoinRoom = vi.fn();

    renderWithRouter(
      <Hero
        onCreateQuiz={vi.fn()}
        onHowItWorksClick={vi.fn()}
        onJoinRoom={onJoinRoom}
      />,
    );

    await user.type(screen.getByLabelText("Have a code?"), "ab-12c3");
    await user.click(screen.getByRole("button", { name: "Join room" }));

    expect(onJoinRoom).toHaveBeenCalledWith("AB12C3");
  });

  it("reserves space and prioritizes the hero artwork", () => {
    renderWithRouter(
      <Hero
        onCreateQuiz={vi.fn()}
        onHowItWorksClick={vi.fn()}
        onJoinRoom={vi.fn()}
      />,
    );

    const artwork = screen.getByRole("img", {
      name: "A Cortex trophy surrounded by colorful quiz controls",
    });

    expect(artwork).toHaveAttribute("width", "960");
    expect(artwork).toHaveAttribute("height", "640");
    expect(artwork).toHaveAttribute("loading", "eager");
    expect(artwork).toHaveAttribute("fetchpriority", "high");
  });
});
