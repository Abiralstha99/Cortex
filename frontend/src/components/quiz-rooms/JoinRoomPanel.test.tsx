import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import JoinRoomPanel from "./JoinRoomPanel";

vi.mock("@/components/dashboard/PublicRoomsList", () => ({
  default: () => <div>Public rooms</div>,
}));

describe("JoinRoomPanel", () => {
  it("shows a precise error and then routes a normalized valid code", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/game/join"]}>
        <Routes>
          <Route path="/game/join" element={<JoinRoomPanel />} />
          <Route
            path="/game/lobby/:roomCode"
            element={<div>Lobby reached</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("Room code"), "abc");
    await user.click(screen.getByRole("button", { name: "Join game" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Room code must be 6 letters or digits",
    );
    await user.clear(screen.getByLabelText("Room code"));
    await user.type(screen.getByLabelText("Room code"), "abc123");
    await user.click(screen.getByRole("button", { name: "Join game" }));
    expect(screen.getByText("Lobby reached")).toBeInTheDocument();
  });
});
