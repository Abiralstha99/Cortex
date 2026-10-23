import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { scrollToLandingSection } from "./scrollToLandingSection";

afterEach(() => { cleanup(); document.getElementById("landing-play-title")?.remove(); });

it.each(["create", "join"])("scrolls %s links to the shared section heading", (hash) => {
  const heading = document.createElement("h2");
  heading.id = "landing-play-title";
  heading.scrollIntoView = vi.fn();
  document.body.appendChild(heading);
  render(<a href={`#${hash}`} onClick={scrollToLandingSection}>Go</a>);
  fireEvent.click(screen.getByRole("link", { name: "Go" }));
  expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
});
