import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import PracticeResult from "./PracticeResult";

const state = vi.hoisted(() => ({ userId: "user-a", getLatestPracticeResult: vi.fn() }));
vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: async () => "token" }), useUser: () => ({ user: { id: state.userId } }) }));
vi.mock("@/lib/api", () => ({ getLatestPracticeResult: state.getLatestPracticeResult }));
vi.mock("@/components/layout/PageShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); state.userId = "user-a"; });

it("does not show another account's cached private result", async () => {
  state.getLatestPracticeResult.mockResolvedValueOnce({ id: "result-a", title: "Secret Quiz", score: 1, questions: [{ id: "q", question: "Secret prompt", correctAnswer: "Private key", explanation: "Private explanation" }], answers: [{ questionId: "q", answer: { answer: "Private response" }, isCorrect: true }] });
  state.getLatestPracticeResult.mockRejectedValueOnce(new Error("Not eligible"));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={["/practice/quizzes/quiz-1/results/latest"]}><Routes><Route path="/practice/quizzes/:quizId/results/latest" element={<PracticeResult />} /></Routes></MemoryRouter></QueryClientProvider>;
  const view = render(tree());
  expect(await screen.findByText("Private response")).toBeVisible();
  state.userId = "user-b";
  view.rerender(tree());
  expect(await screen.findByRole("alert")).toHaveTextContent("Not eligible");
  expect(screen.queryByText("Private response")).toBeNull();
});
