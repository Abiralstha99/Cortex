import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "@/test/render";
import CreateStage from "./CreateStage";

afterEach(() => {
  vi.clearAllMocks();
});

describe("CreateStage", () => {
  it("shows Continue after accepting a valid PDF", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderWithRouter(<CreateStage onContinue={onContinue} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hi"], "notes.pdf", { type: "application/pdf" });
    await user.upload(input, file);
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledWith(file);
  });

  it("shows inline error for unsupported files", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderWithRouter(<CreateStage onContinue={onContinue} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hi"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    await user.upload(input, file);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toBe("Only PDF and plain text files are supported.");
    expect(onContinue).not.toHaveBeenCalled();
  });
});

