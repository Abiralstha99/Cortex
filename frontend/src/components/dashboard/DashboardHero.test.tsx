import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/render";
import DashboardHero from "./DashboardHero";

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

afterEach(cleanup);

describe("DashboardHero", () => {
  it.each([
    ["Join game", "/game/join"],
    ["Host game", "/game/create"],
  ])("routes %s to %s", async (label, path) => {
    renderWithRouter(
      <>
        <DashboardHero firstName="Maya" />
        <LocationProbe />
      </>,
      "/dashboard",
    );

    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(screen.getByRole("status")).toHaveTextContent(path);
  });
});
