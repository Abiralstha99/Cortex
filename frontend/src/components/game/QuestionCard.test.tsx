import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import QuestionCard from "./QuestionCard";

afterEach(() => cleanup());

it("locks every answer and confirms submission", async () => {
  const onSubmit = vi.fn();
  const { rerender } = render(
    <QuestionCard
      question="FIFO?"
      type="MCQ"
      options={["Stack", "Queue", "Heap", "Tree"]}
      onSubmit={onSubmit}
      disabled={false}
      selectedAnswer={null}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /B.*Queue/i }));
  expect(onSubmit).toHaveBeenCalledWith(1);

  rerender(
    <QuestionCard
      question="FIFO?"
      type="MCQ"
      options={["Stack", "Queue", "Heap", "Tree"]}
      onSubmit={onSubmit}
      disabled
      selectedAnswer={1}
    />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Checking your answer");
  for (const button of screen.getAllByRole("button")) {
    expect(button).toBeDisabled();
  }
});

it("shows only the submitted and correct choices after private feedback", () => {
  render(<QuestionCard question="FIFO?" type="MCQ" options={["Stack", "Queue", "Heap", "Tree"]}
    onSubmit={vi.fn()} disabled selectedAnswer={0}
    answerResult={{ questionId: "q1", roundNumber: 1, correctAnswer: 1, correct: false, pointsEarned: 0, placement: null }} />);
  expect(screen.getByRole("button", { name: /Stack/ })).toHaveTextContent("Incorrect");
  expect(screen.getByRole("button", { name: /Queue/ })).toHaveTextContent("Correct");
  expect(screen.getByRole("status")).toHaveTextContent("Waiting for other players");
});

it("renders every answer as a full-width, keyboard-addressable choice", async () => {
  const onSubmit = vi.fn();
  const { container } = render(
    <QuestionCard
      question="Which statement best describes this long question?"
      type="MCQ"
      options={[
        "A long answer that should wrap naturally without becoming difficult to scan.",
        "Queue",
        "Heap",
        "Tree",
      ]}
      onSubmit={onSubmit}
      disabled={false}
      selectedAnswer={null}
    />,
  );

  const answers = Array.from(container.querySelectorAll("button"));
  expect(answers).toHaveLength(4);
  expect(answers[0]).toHaveAccessibleName(/A.*long answer/i);
  expect(answers[1]).toHaveAccessibleName(/B.*Queue/i);
  expect(answers[2]).toHaveAccessibleName(/C.*Heap/i);
  expect(answers[3]).toHaveAccessibleName(/D.*Tree/i);

  await userEvent.tab();
  expect(answers[0]).toHaveFocus();
  fireEvent.click(answers[0]);
  expect(onSubmit).toHaveBeenCalledWith(0);
});

it("submits true or false as a boolean", async () => {
  const onSubmit = vi.fn();
  render(<QuestionCard question="Is this true?" type="TRUE_FALSE" onSubmit={onSubmit} disabled={false} selectedAnswer={null} />);
  await userEvent.click(screen.getByRole("button", { name: /True/ }));
  expect(onSubmit).toHaveBeenCalledWith(true);
});

it("submits a nonempty fill in the blank response", async () => {
  const onSubmit = vi.fn();
  render(<QuestionCard question="Name the capital" type="FILL_BLANK" onSubmit={onSubmit} disabled={false} selectedAnswer={null} />);
  await userEvent.type(screen.getByRole("textbox", { name: "Your answer" }), " Paris ");
  await userEvent.click(screen.getByRole("button", { name: "Submit answer" }));
  expect(onSubmit).toHaveBeenCalledWith(" Paris ");
});

it("shows accepted text beside a recovered blank answer", () => {
  render(<QuestionCard question="Capital?" type="FILL_BLANK" onSubmit={vi.fn()} disabled
    selectedAnswer="Lyon" answerResult={{ questionId: "q1", roundNumber: 1, correctAnswer: "Paris", correct: false, pointsEarned: 0, placement: null }} />);
  expect(screen.getByRole("textbox", { name: "Your answer" })).toHaveValue("Lyon");
  expect(screen.getByText("Accepted answer: Paris")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
});

it("marks the correct true or false answer after a wrong selection", () => {
  render(<QuestionCard question="Is it true?" type="TRUE_FALSE" onSubmit={vi.fn()} disabled selectedAnswer={false}
    answerResult={{ questionId: "q1", roundNumber: 1, correctAnswer: true, correct: false, pointsEarned: 0, placement: null }} />);
  expect(screen.getByRole("button", { name: /True/ })).toHaveTextContent("Correct");
  expect(screen.getByRole("button", { name: /False/ })).toHaveTextContent("Incorrect");
});
