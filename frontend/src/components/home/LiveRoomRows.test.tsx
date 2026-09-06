import LiveRoomRows from "./LiveRoomRows";
import { renderWithRouter } from "@/test/render";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@clerk/react", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseQuery = vi.fn();
const mockUseQueryClient = vi.fn(() => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => ({ socket: null, connected: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LiveRoomRows", () => {
  it("renders null when signed out", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: [] });
    const { container } = renderWithRouter(<LiveRoomRows />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders null when signed in but no rooms", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: [] });
    const { container } = renderWithRouter(<LiveRoomRows />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders heading and rows when signed in with rooms", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken: async () => "tok" });
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ gameId: "g1", roomCode: "RC1", hostUsername: "Host", playerCount: 1, maxPlayers: 4, createdAt: new Date().toISOString() }],
    });
    const { getByText } = renderWithRouter(<LiveRoomRows />);
    expect(getByText("Open public rooms")).toBeTruthy();
    expect(getByText("Host")).toBeTruthy();
  });
});

