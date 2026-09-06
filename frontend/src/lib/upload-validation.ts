export const ACCEPTED_UPLOAD_TYPES = ["application/pdf", "text/plain"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateQuizUploadFile(file: File): UploadValidationResult {
  if (!(ACCEPTED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only PDF and plain text files are supported." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File must be under 10MB." };
  }
  return { ok: true };
}

export function titleFromFilename(name: string): string {
  return name.replace(/\.(pdf|txt)$/i, "").trim();
}
