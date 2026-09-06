import QuizRows from "./QuizRows";
import { renderWithRouter } from "@/test/render";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@clerk/react", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("QuizRows", () => {
  it("renders null when signed out", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: [] });
    const { container } = renderWithRouter(<QuizRows />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders null when signed in but no quizzes", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: [] });
    const { container } = renderWithRouter(<QuizRows />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders heading and rows when signed in with quizzes", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ id: "q1", title: "Quiz 1", questionCount: 5 }],
    });
    const { getByText } = renderWithRouter(<QuizRows />);
    expect(getByText("Your quizzes")).toBeTruthy();
    expect(getByText("Quiz 1")).toBeTruthy();
  });
});

