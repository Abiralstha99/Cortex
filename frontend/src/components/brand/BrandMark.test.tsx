import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithRouter } from "@/test/render";
import { BrandMark } from "./BrandMark";

afterEach(cleanup);

describe("BrandMark", () => {
  it("gives the linked wordmark a 44px target and visible keyboard focus", () => {
    renderWithRouter(<BrandMark to="/dashboard" />);

    const wordmark = screen.getByRole("link", { name: "Cortex." });
    expect(wordmark).toHaveAttribute("href", "/dashboard");
    expect(wordmark).toHaveClass(
      "inline-flex",
      "min-h-11",
      "min-w-11",
      "items-center",
      "outline-none",
      "focus-visible:ring-3",
    );
  });

  it("preserves the optional destination's root-link default", () => {
    renderWithRouter(<BrandMark />);

    expect(screen.getByRole("link", { name: "Cortex." })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
