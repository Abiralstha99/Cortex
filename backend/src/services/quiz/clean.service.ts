/**
 * Normalize extracted document text: fix newlines, drop common PDF
 * artifacts, and collapse excess whitespace.
 */
export function cleanText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Drop "Page N of M" lines and isolated pure-digit lines (common PDF artifacts)
  text = text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(t)) return false;
      if (/^\d+$/.test(t)) return false;
      return true;
    })
    .join("\n");

  // Collapse 3+ newlines → 2; collapse horizontal whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
