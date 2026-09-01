import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the semantic primary treatment by default", () => {
    render(<Button>Host game</Button>);
    expect(screen.getByRole("button", { name: "Host game" })).toHaveClass(
      "bg-primary",
      "rounded-[var(--radius-control)]",
    );
  });

  it("keeps secondary actions visibly bordered", () => {
    render(<Button variant="outline">Join game</Button>);
    expect(screen.getByRole("button", { name: "Join game" })).toHaveClass(
      "border-border",
      "bg-surface",
    );
  });
});
