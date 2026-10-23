import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import PracticeLibrary from "./PracticeLibrary";

const api = vi.hoisted(() => ({ getPracticeLibrary: vi.fn(), startPractice: vi.fn(), deleteSoloQuiz: vi.fn() }));
vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: async () => "token" }), useUser: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/api", () => api);
vi.mock("@/components/layout/PageShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => <button role="menuitem" onClick={onSelect}>{children}</button>,
}));

function show(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const router = createMemoryRouter([
    { path: "/practice", element: <PracticeLibrary /> },
    { path: "/practice/sessions/:sessionId", element: <p>Session destination</p> },
    { path: "/practice/quizzes/:quizId/results/latest", element: <p>Results destination</p> },
    { path: "/practice/create", element: <p>Create destination</p> },
  ], { initialEntries: ["/practice"] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("shows created and played tabs with status-driven actions and keyboard navigation", async () => {
  api.getPracticeLibrary.mockResolvedValue({ created: [
    { id: "new", title: "New quiz", questionCount: 3, unfinished: null, latestResult: null },
    { id: "active", title: "Active quiz", questionCount: 4, unfinished: { id: "active-session", answeredCount: 2 }, latestResult: { id: "old", score: 4 } },
    { id: "done", title: "Done quiz", questionCount: 5, unfinished: null, latestResult: { id: "result", score: 3 } },
  ], played: [{ id: "played", title: "Friend quiz", questionCount: 2, unfinished: null, latestResult: null }] });
  api.startPractice.mockResolvedValue({ id: "session-2" });
  show();
  expect(await screen.findByText("New quiz")).toBeVisible();
  expect(screen.getByText("Not started")).toBeVisible();
  expect(screen.getByText(/In progress/)).toHaveTextContent("2/4 answered");
  expect(screen.getByText(/Completed/)).toHaveTextContent("3/5");
  expect(screen.getByRole("button", { name: "Resume" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Practice again" })).toBeVisible();
  expect(screen.getByRole("link", { name: "View results" })).toHaveAttribute("href", "/practice/quizzes/done/results/latest");
  const tab = screen.getByRole("tab", { name: "Created by me" });
  tab.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Played with friends" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Friend quiz")).toBeVisible();
  expect(screen.queryByText("New quiz")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Start practice" }));
  expect(api.startPractice).toHaveBeenCalledWith("token", "played", false);
  expect(await screen.findByText("Session destination")).toBeVisible();
});

it("opens a started session while library refresh is still pending", async () => {
  api.getPracticeLibrary.mockResolvedValue({ created: [{ id: "quiz", title: "Quiz", questionCount: 1, unfinished: null, latestResult: null }], played: [] });
  api.startPractice.mockResolvedValue({ id: "session-2" });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(client, "invalidateQueries").mockImplementation(() => new Promise(() => {}));
  show(client);
  await screen.findByText("Quiz");
  await userEvent.click(screen.getByRole("button", { name: "Start practice" }));
  expect(await screen.findByText("Session destination")).toBeVisible();
});

it("shows a specific empty state in each tab", async () => {
  api.getPracticeLibrary.mockResolvedValue({ created: [], played: [] });
  show();
  expect(await screen.findByText(/created quizzes/i)).toBeVisible();
  await userEvent.click(screen.getByRole("tab", { name: "Played with friends" }));
  expect(screen.getByText(/played with friends/i, { selector: "p" })).toBeVisible();
});

it("links to solo creation and only offers deletion on solo rows", async () => {
  api.getPracticeLibrary.mockResolvedValue({ created: [
    { id: "solo", title: "Solo notes", classification: "SOLO_ONLY", questionCount: 2, unfinished: null, latestResult: null },
    { id: "multi", title: "Group notes", classification: "MULTIPLAYER", questionCount: 2, unfinished: null, latestResult: null },
  ], played: [] });
  show();
  expect(await screen.findByText("Solo notes")).toBeVisible();
  expect(screen.getByRole("link", { name: "Create practice quiz" })).toHaveAttribute("href", "/practice/create");
  expect(screen.getAllByRole("button", { name: /quiz actions/i })).toHaveLength(1);
});

it("confirms solo deletion, removes its row, and reports server errors", async () => {
  api.getPracticeLibrary.mockResolvedValue({ created: [{ id: "solo", title: "Solo notes", classification: "SOLO_ONLY", questionCount: 2, unfinished: null, latestResult: null }], played: [] });
  api.deleteSoloQuiz.mockRejectedValueOnce(new Error("Could not delete quiz"));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  show();
  await screen.findByText("Solo notes");
  await userEvent.click(screen.getByRole("button", { name: /quiz actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete quiz" }));
  expect(confirm).toHaveBeenCalled();
  expect(api.deleteSoloQuiz).toHaveBeenCalledWith("token", "solo");
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete quiz");
  confirm.mockRestore();
});

it.each([
  ["Resume", { id: "active", title: "Active", questionCount: 2, unfinished: { id: "saved", answeredCount: 1 }, latestResult: { id: "old", score: 2 } }],
  ["Practice again", { id: "done", title: "Done", questionCount: 2, unfinished: null, latestResult: { id: "result", score: 1 } }],
])("%s opens the existing session or a new attempt", async (action, quiz) => {
  api.getPracticeLibrary.mockResolvedValue({ created: [quiz], played: [] });
  api.startPractice.mockResolvedValue({ id: "session-2" });
  show();
  await screen.findByText(quiz.title);
  await userEvent.click(screen.getByRole("button", { name: action }));
  expect(api.startPractice).toHaveBeenCalledWith("token", quiz.id, false);
  expect(await screen.findByText("Session destination")).toBeVisible();
});
