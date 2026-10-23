import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import PracticePlayer from "./PracticePlayer";

const api = vi.hoisted(() => ({ getPracticeSession: vi.fn(), savePracticeAnswer: vi.fn(), clearPracticeAnswer: vi.fn(), submitPractice: vi.fn() }));
vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: async () => "token" }), useUser: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/api", () => api);
vi.mock("@/components/layout/PageShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

function session() {
  return { id: "session-1", quizId: "quiz-1", title: "Biology", status: "IN_PROGRESS", resumeIndex: 0, answers: [], questions: [
    { id: "q1", type: "MCQ", question: "What is a cell?", options: ["Organism", "Unit of life"] },
    { id: "q2", type: "TRUE_FALSE", question: "Cells have membranes?" },
  ] };
}

function renderPractice(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const router = createMemoryRouter([
    { path: "/practice", element: <p>Library destination</p> },
    { path: "/practice/sessions/:sessionId", element: <PracticePlayer /> },
    { path: "/practice/quizzes/:quizId/results/latest", element: <p>Results destination</p> },
  ], { initialEntries: ["/practice", "/practice/sessions/session-1"] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("PracticePlayer", () => {
  it("locks answer controls while a save is pending", async () => {
    api.getPracticeSession.mockResolvedValue(session());
    let finishSave!: (value: unknown) => void;
    api.savePracticeAnswer.mockReturnValue(new Promise((resolve) => { finishSave = resolve; }));
    renderPractice();
    await screen.findByRole("heading", { name: "What is a cell?" });
    await userEvent.click(screen.getByLabelText("Unit of life"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Unit of life")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear answer" })).toBeDisabled();
    finishSave({});
    expect(await screen.findByRole("heading", { name: "Cells have membranes?" })).toBeVisible();
  });

  it("warns before browser history leaves an unsaved edit", async () => {
    api.getPracticeSession.mockResolvedValue(session());
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    const router = renderPractice();
    await screen.findByRole("heading", { name: "What is a cell?" });
    await userEvent.click(screen.getByLabelText("Unit of life"));
    await act(async () => { await router.navigate(-1); });
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "What is a cell?" })).toBeVisible();
  });

  it("keeps the edit and position when save fails, then retries before moving", async () => {
    api.getPracticeSession.mockResolvedValue(session());
    api.savePracticeAnswer.mockRejectedValueOnce(new Error("Network failed")).mockResolvedValue({});
    renderPractice();
    await screen.findByRole("heading", { name: "What is a cell?" });
    await userEvent.click(screen.getByLabelText("Unit of life"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Network failed");
    expect(screen.getByRole("heading", { name: "What is a cell?" })).toBeVisible();
    expect(screen.getByLabelText("Unit of life")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("heading", { name: "Cells have membranes?" })).toBeVisible();
    expect(api.savePracticeAnswer).toHaveBeenCalledTimes(2);
  });

  it("warns before internal navigation with an unsaved edit", async () => {
    api.getPracticeSession.mockResolvedValue(session());
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    renderPractice();
    await screen.findByRole("heading", { name: "What is a cell?" });
    fireEvent.click(screen.getByLabelText("Unit of life"));
    fireEvent.click(screen.getByRole("link", { name: /Practice library/ }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "What is a cell?" })).toBeVisible();
  });

  it("refetches a saved answer when returning to the same session", async () => {
    const first = session();
    const current = { ...session(), resumeIndex: 1, answers: [{ questionId: "q1", answer: { selectedIndex: 1 } }] };
    api.getPracticeSession.mockResolvedValueOnce(first).mockResolvedValue(current);
    api.savePracticeAnswer.mockResolvedValue({});
    const router = renderPractice();
    await screen.findByRole("heading", { name: "What is a cell?" });
    await userEvent.click(screen.getByLabelText("Unit of life"));
    await userEvent.click(screen.getByRole("button", { name: "Save and exit" }));
    expect(await screen.findByText("Library destination")).toBeVisible();
    await act(async () => { await router.navigate("/practice/sessions/session-1"); });
    expect(await screen.findByRole("heading", { name: "Cells have membranes?" })).toBeVisible();
    expect(api.getPracticeSession).toHaveBeenCalledTimes(2);
  });

  it("opens results after submission while library refresh is pending", async () => {
    api.getPracticeSession.mockResolvedValue({ ...session(), resumeIndex: -1, answers: [
      { questionId: "q1", answer: { selectedIndex: 1 } },
      { questionId: "q2", answer: { answer: true } },
    ] });
    api.submitPractice.mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(client, "invalidateQueries").mockImplementation(() => new Promise(() => {}));
    renderPractice(client);
    expect(await screen.findByRole("heading", { name: "Review your answers" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Submit practice" }));
    expect(await screen.findByText("Results destination")).toBeVisible();
  });
});
