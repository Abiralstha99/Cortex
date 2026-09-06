import LiveRoomRows from "./LiveRoomRows";
import { renderWithRouter } from "@/test/render";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ isLoading: false, isError: false, data: [] }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => ({ socket: null, connected: false }),
}));

afterEach(cleanup);

describe("LiveRoomRows (signed out)", () => {
  it("renders null when signed out", () => {
    const { container } = renderWithRouter(<LiveRoomRows />);
    expect(container).toBeEmptyDOMElement();
  });
});

