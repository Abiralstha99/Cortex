import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("provides a 44px minimum target around its compact track", () => {
    render(<Switch aria-label="Make room public" />);

    expect(screen.getByRole("switch", { name: "Make room public" })).toHaveClass(
      "min-h-11",
      "min-w-11",
    );
  });
});
