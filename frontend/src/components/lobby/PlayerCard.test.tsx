import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlayerCard from "./PlayerCard";

describe("PlayerCard", () => {
  it("announces self, host, and readiness without color alone", () => {
    render(
      <PlayerCard
        player={{ id: "p1", username: "Maya", ready: true }}
        isHost
        isSelf
      />,
    );

    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
