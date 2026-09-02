import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "@/test/render";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingNav } from "./LandingNav";

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
    expect(artwork).toHaveAttribute(
      "src",
      "/assets/landing/cortex-quiz-arena-navy.png",
    );
    expect(artwork).toHaveClass("object-contain");
    expect(artwork).not.toHaveClass("object-cover");

    const picture = artwork.closest("picture");
    expect(picture).not.toBeNull();

    const avifSource = picture?.querySelector('source[type="image/avif"]');
    expect(avifSource).toHaveAttribute(
      "srcset",
      "/assets/landing/cortex-quiz-arena-navy-640.avif 640w, /assets/landing/cortex-quiz-arena-navy-960.avif 960w",
    );
    expect(avifSource).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 70vw, 100vw",
    );

    expect(picture?.querySelector('source[type="image/webp"]')).toBeNull();
  });

  it("uses one label for the quiz creation intent", () => {
    renderWithRouter(
      <>
        <LandingNav onPlayNow={vi.fn()} onHowItWorksClick={vi.fn()} />
        <Hero
          onCreateQuiz={vi.fn()}
          onHowItWorksClick={vi.fn()}
          onJoinRoom={vi.fn()}
        />
        <FinalCta onStart={vi.fn()} />
      </>,
    );

    expect(
      screen.getAllByRole("button", { name: "Create quiz" }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Start a quiz" }),
    ).not.toBeInTheDocument();
  });
});
