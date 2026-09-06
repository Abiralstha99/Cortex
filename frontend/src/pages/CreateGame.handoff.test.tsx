import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CreateGame from "./CreateGame";
import { useHomeIntentStore } from "@/stores/homeIntentStore";

vi.mock("@/lib/api", () => ({
  listQuizzes: async () => [],
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    getToken: async () => "tok",
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({ user: { firstName: "Test", username: "testuser" } }),
  useClerk: () => ({ signOut: () => {} }),
}));

function renderCreateGame() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/game/create"]}>
        <CreateGame />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  useHomeIntentStore.getState().clear();
});

describe("CreateGame handoff", () => {
  it("acknowledges a handed-off file without requiring a second upload", () => {
    const file = new File(["x"], "chem.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    renderCreateGame();

    expect(screen.getByText("chem.pdf")).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose a quiz file/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /set up the room/i })).toBeInTheDocument();
  });

  it("remains usable when opened with no pending file", () => {
    useHomeIntentStore.getState().clear();
    renderCreateGame();
    expect(screen.getByLabelText(/choose a quiz file/i)).toBeInTheDocument();
  });
});

