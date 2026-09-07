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
      options={["Stack", "Queue", "Heap", "Tree"]}
      onSubmit={onSubmit}
      disabled={false}
      selectedIndex={null}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /B.*Queue/i }));
  expect(onSubmit).toHaveBeenCalledWith(1);

  rerender(
    <QuestionCard
      question="FIFO?"
      options={["Stack", "Queue", "Heap", "Tree"]}
      onSubmit={onSubmit}
      disabled
      selectedIndex={1}
    />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Answer submitted");
  for (const button of screen.getAllByRole("button")) {
    expect(button).toBeDisabled();
  }
});

it("renders every answer as a full-width, keyboard-addressable choice", async () => {
  const onSubmit = vi.fn();
  const { container } = render(
    <QuestionCard
      question="Which statement best describes this long question?"
      options={[
        "A long answer that should wrap naturally without becoming difficult to scan.",
        "Queue",
        "Heap",
        "Tree",
      ]}
      onSubmit={onSubmit}
      disabled={false}
      selectedIndex={null}
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
