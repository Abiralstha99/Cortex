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

  it("keeps compact button sizes at the minimum touch target", () => {
    render(
      <>
        <Button size="xs">Compact</Button>
        <Button size="sm">Small</Button>
        <Button size="icon" aria-label="Add game" />
        <Button size="icon-sm" aria-label="Remove game" />
      </>,
    );

    for (const name of ["Compact", "Small", "Add game", "Remove game"]) {
      expect(screen.getByRole("button", { name })).toHaveClass(
        "min-h-11",
        "min-w-11",
      );
    }
  });
});
