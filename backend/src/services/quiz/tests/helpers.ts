/** Shared fixtures for quiz unit tests. */
export function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
}
