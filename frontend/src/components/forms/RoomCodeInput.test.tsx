import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import RoomCodeInput from "./RoomCodeInput";

afterEach(cleanup);

describe("RoomCodeInput", () => {
  it("normalizes typed input", async () => {
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <RoomCodeInput
          id="code"
          label="Room code"
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByLabelText("Room code");
    expect(input).toHaveAttribute("maxlength", "6");
    await userEvent.type(input, "ab-12c3");
    expect(input).toHaveValue("AB12C3");
  });

  it("links an error to the input", () => {
    render(
      <RoomCodeInput
        id="code"
        label="Room code"
        value="ABC"
        onChange={() => undefined}
        error="Room code must be 6 letters or digits"
      />,
    );
    expect(screen.getByRole("alert")).toHaveAttribute("id", "code-error");
    expect(screen.getByLabelText("Room code")).toHaveAttribute(
      "aria-describedby",
      "code-error",
    );
  });
});
