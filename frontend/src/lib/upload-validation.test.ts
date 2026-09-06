import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  validateQuizUploadFile,
  titleFromFilename,
} from "./upload-validation";

describe("validateQuizUploadFile", () => {
  it("accepts PDF under the size limit", () => {
    const file = new File(["x"], "notes.pdf", { type: "application/pdf" });
    expect(validateQuizUploadFile(file)).toEqual({ ok: true });
  });

  it("rejects unsupported types", () => {
    const file = new File(["x"], "notes.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(validateQuizUploadFile(file)).toEqual({
      ok: false,
      error: "Only PDF and plain text files are supported.",
    });
  });

  it("rejects files over 10MB", () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
    expect(validateQuizUploadFile(file)).toEqual({
      ok: false,
      error: "File must be under 10MB.",
    });
  });

  it("strips extension for title suggestion", () => {
    expect(titleFromFilename("Cell Biology.pdf")).toBe("Cell Biology");
  });
});
