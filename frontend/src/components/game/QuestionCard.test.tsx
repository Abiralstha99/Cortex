import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import QuestionCard from "./QuestionCard";

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
