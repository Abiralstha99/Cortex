import QuizRows from "./QuizRows";
import { renderWithRouter } from "@/test/render";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isLoading: false, isError: false, data: [] }),
}));

afterEach(cleanup);

describe("QuizRows (signed out)", () => {
  it("renders null when signed out", () => {
    const { container } = renderWithRouter(<QuizRows />);
    expect(container).toBeEmptyDOMElement();
  });
});

