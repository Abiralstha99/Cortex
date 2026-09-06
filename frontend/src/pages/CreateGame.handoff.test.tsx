import { render, screen, cleanup } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CreateGame from "./CreateGame";
import {
  clearFileHandoffCache,
  useHomeIntentStore,
} from "@/stores/homeIntentStore";

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

function renderCreateGame(strict = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/game/create"]}>
        <CreateGame />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

afterEach(() => {
  cleanup();
  useHomeIntentStore.getState().clear();
  clearFileHandoffCache();
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

  it("keeps handed-off file under StrictMode remount", () => {
    const file = new File(["x"], "chem.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    renderCreateGame(true);

    expect(screen.getByText("chem.pdf")).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose a quiz file/i)).not.toBeInTheDocument();
  });
});

