import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Timer from "./Timer";

describe("Timer", () => {
  afterEach(() => vi.useRealTimers());

  it("announces remaining seconds while visual progress changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00.000Z"));
    render(<Timer startedAt={new Date()} timeLimit={30_000} />);

    expect(screen.getByRole("timer")).toHaveAccessibleName(
      "30 seconds remaining",
    );
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    act(() => {
      vi.advanceTimersByTime(26_000);
    });

    expect(screen.getByRole("timer")).toHaveAccessibleName(
      "4 seconds remaining",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "13",
    );

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByRole("timer")).toHaveAccessibleName(
      "1 second remaining",
    );
  });
});
