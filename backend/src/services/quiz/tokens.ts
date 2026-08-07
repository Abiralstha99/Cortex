/** Word-count × 1.3 approximation for GPT-family token counts (chunking / batching only). */
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return Math.ceil(words.length * 1.3);
}
