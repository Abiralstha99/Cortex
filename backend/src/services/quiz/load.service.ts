import { PDFParse } from "pdf-parse";
import { cleanText } from "./clean.service.js";
import { LoadError } from "./errors.js";

const PDF_MIME = "application/pdf";
const TEXT_MIME = "text/plain";

export type LoadDocumentInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export type LoadDocumentResult = {
  text: string;
  sourceType: "pdf" | "text";
  title: string;
};

function titleFromFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const trimmed = withoutExt.trim().slice(0, 255);
  return trimmed.length > 0 ? trimmed : "Untitled quiz";
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse v2: class API with in-memory `data`
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function loadDocument(
  input: LoadDocumentInput,
): Promise<LoadDocumentResult> {
  const mime = input.mimeType.toLowerCase();
  let raw: string;
  let sourceType: "pdf" | "text";

  if (mime === PDF_MIME || input.originalName.toLowerCase().endsWith(".pdf")) {
    sourceType = "pdf";
    try {
      raw = await extractPdfText(input.buffer);
    } catch (err) {
      if (err instanceof LoadError) throw err;
      throw new LoadError("Failed to parse PDF");
    }
  } else if (
    mime === TEXT_MIME ||
    mime === "text/markdown" ||
    input.originalName.toLowerCase().endsWith(".txt") ||
    input.originalName.toLowerCase().endsWith(".md")
  ) {
    sourceType = "text";
    raw = input.buffer.toString("utf8");
  } else {
    throw new LoadError(`Unsupported file type: ${input.mimeType}`);
  }

  const text = cleanText(raw);
  if (text.length === 0) {
    throw new LoadError("Document produced no readable text");
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) {
    throw new LoadError("Document too short (minimum 50 words)");
  }

  return {
    text,
    sourceType,
    title: titleFromFilename(input.originalName),
  };
}
