import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import CreatePracticeQuiz from "./CreatePracticeQuiz";

const api = vi.hoisted(() => ({ generateQuiz: vi.fn(), getQuizJob: vi.fn(), startPractice: vi.fn() }));
vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: async () => "token" }), useUser: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/api", () => api);
vi.mock("@/components/layout/PageShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

function show() {
  const router = createMemoryRouter([
    { path: "/practice/create", element: <CreatePracticeQuiz /> },
    { path: "/practice/sessions/:sessionId", element: <p>Practice session</p> },
    { path: "/practice", element: <p>Practice library</p> },
  ], { initialEntries: ["/practice/create"] });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("uploads notes as solo-only generation and starts practice when ready", async () => {
  api.generateQuiz.mockResolvedValue({ jobId: "job-1", status: "processing" });
  api.getQuizJob.mockResolvedValue({ jobId: "job-1", status: "ready", quizId: "quiz-1" });
  api.startPractice.mockResolvedValue({ id: "session-1" });
  show();
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, new File(["word ".repeat(60)], "notes.txt", { type: "text/plain" }));
  await userEvent.click(screen.getByRole("button", { name: "Generate questions" }));
  expect(api.generateQuiz).toHaveBeenCalledWith("token", expect.any(File), 10, "notes", true);
  await userEvent.click(await screen.findByRole("button", { name: "Start practice" }));
  expect(api.startPractice).toHaveBeenCalledWith("token", "quiz-1");
  expect(await screen.findByText("Practice session")).toBeVisible();
});

it("shows a generation failure and allows another upload attempt", async () => {
  api.generateQuiz.mockResolvedValue({ jobId: "job-2", status: "processing" });
  api.getQuizJob.mockResolvedValue({ jobId: "job-2", status: "failed", errorMessage: "Could not make questions" });
  show();
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, new File(["word ".repeat(60)], "notes.txt", { type: "text/plain" }));
  await userEvent.click(screen.getByRole("button", { name: "Generate questions" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not make questions");
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
});
