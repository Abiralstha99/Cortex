import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConnectionBanner from "./ConnectionBanner";

describe("ConnectionBanner", () => {
  it("keeps reconnecting non-blocking", () => {
    render(
      <ConnectionBanner
        state="reconnecting"
        onRetry={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Connection lost. Reconnecting...",
    );
  });

  it("offers recovery only when automatic reconnection stopped", () => {
    render(
      <ConnectionBanner state="offline" onRetry={vi.fn()} onExit={vi.fn()} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't reconnect you to this game.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument();
  });
});
