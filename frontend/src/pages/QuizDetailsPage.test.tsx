import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import QuizDetailsPage from "./QuizDetailsPage";

const { getQuiz, deleteQuiz } = vi.hoisted(() => ({ getQuiz: vi.fn(), deleteQuiz: vi.fn() }));
vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("@/lib/api", () => ({ getQuiz, deleteQuiz }));
vi.mock("@/components/layout/PageShell", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => <button role="menuitem" onClick={onSelect}>{children}</button>,
}));

function Destination() {
  const location = useLocation();
  return <output role="status">{location.pathname}:{(location.state as { quizId?: string } | null)?.quizId}</output>;
}

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("QuizDetailsPage", () => {
  it("shows expandable previews and hosts the selected quiz", async () => {
    getQuiz.mockResolvedValue({ id: "quiz-1", title: "Cell biology", questionCount: 1, questions: [{ id: "q-1", position: 0, type: "MCQ", question: "What is a cell?", options: ["A", "B"] }] });
    renderWithRouter(<Routes><Route path="/quizzes/:quizId" element={<QuizDetailsPage />} /><Route path="/game/create" element={<Destination />} /></Routes>, "/quizzes/quiz-1");

    expect(await screen.findByRole("heading", { name: "Cell biology" })).toBeInTheDocument();
    await userEvent.click(screen.getByText("What is a cell?"));
    expect(screen.getByText("A")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Host game" }));
    expect(screen.getByRole("status")).toHaveTextContent("/game/create:quiz-1");
  });

  it("requires confirmation before deleting", async () => {
    getQuiz.mockResolvedValue({ id: "quiz-1", title: "Cell biology", questionCount: 0, questions: [] });
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    renderWithRouter(<Routes><Route path="/quizzes/:quizId" element={<QuizDetailsPage />} /></Routes>, "/quizzes/quiz-1");

    await screen.findByRole("heading", { name: "Cell biology" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete quiz" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(deleteQuiz).not.toHaveBeenCalled();
  });

  it("keeps an older saved quiz accessible when question previews are absent", async () => {
    getQuiz.mockResolvedValue({ id: "quiz-1", title: "Cell biology", questionCount: 3 });
    renderWithRouter(<Routes><Route path="/quizzes/:quizId" element={<QuizDetailsPage />} /><Route path="/game/create" element={<Destination />} /></Routes>, "/quizzes/quiz-1");

    expect(await screen.findByRole("heading", { name: "Cell biology" })).toBeInTheDocument();
    expect(screen.getByText("Question previews are unavailable right now.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Host game" }));
    expect(screen.getByRole("status")).toHaveTextContent("/game/create:quiz-1");
  });

  it("blocks other actions while a confirmed deletion is pending", async () => {
    getQuiz.mockResolvedValue({ id: "quiz-1", title: "Cell biology", questionCount: 1, questions: [] });
    deleteQuiz.mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("confirm", () => true);
    renderWithRouter(<Routes><Route path="/quizzes/:quizId" element={<QuizDetailsPage />} /></Routes>, "/quizzes/quiz-1");
    await screen.findByRole("heading", { name: "Cell biology" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete quiz" }));
    expect(await screen.findByText("Deleting quiz...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Host game" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quiz actions" })).toBeDisabled();
  });
});
