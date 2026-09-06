import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import JoinRail from "./JoinRail";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JoinRail", () => {
  it("shows validation error for invalid code and calls onJoin for valid code", async () => {
    const onJoin = vi.fn();

    renderWithRouter(<JoinRail onJoin={onJoin} />);

    const input = screen.getByLabelText("Room code");
    await userEvent.type(input, "abc"); // invalid (too short)
    const button = screen.getByRole("button", { name: /join/i });
    await userEvent.click(button);

    expect(screen.getByRole("alert")).toHaveTextContent("Room code must be 6 letters or digits.");
    expect(onJoin).not.toHaveBeenCalled();

    // correct it
    await userEvent.clear(input);
    await userEvent.type(input, "ab-12c3");
    await userEvent.click(button);

    expect(onJoin).toHaveBeenCalledWith("AB12C3");
  });
});

