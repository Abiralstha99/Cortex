import type { SourcePack } from "../../types/quiz.types.js";
import { estimateTokens } from "./tokens.js";

export const DEFAULT_BATCH_TOKEN_BUDGET = 3000;
const CHUNK_JOIN_SEPARATOR = "\n\n---\n\n";
export function chunkIdForIndex(index: number): string {
  return `chunk-${index + 1}`;
}

/**
 * Pack source chunks into input-budget packs for the adaptive pipeline.
 * Preserves chunk order and original indices. Does not allocate question counts.
 */
export function packSourceChunks(
  chunks: string[],
  inputTokenBudget: number,
): SourcePack[] {
  const packs: SourcePack[] = [];
  let current: SourcePack | null = null;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]!;
    const chunkId = chunkIdForIndex(index);
    const labeledChunk = `[${chunkId}]\n${chunk}`;
    const tokens = estimateTokens(labeledChunk);

    if (!current) {
      current = {
        text: labeledChunk,
        chunkIndices: [index],
        chunks: [{ chunkId, text: chunk }],
        estimatedInputTokens: tokens,
      };
      continue;
    }

    const joinedText = `${current.text}${CHUNK_JOIN_SEPARATOR}${labeledChunk}`;
    const joinedTokens = estimateTokens(joinedText);

    if (joinedTokens > inputTokenBudget) {
      packs.push(current);
      current = {
        text: labeledChunk,
        chunkIndices: [index],
        chunks: [{ chunkId, text: chunk }],
        estimatedInputTokens: tokens,
      };
      continue;
    }

    current.text = joinedText;
    current.chunkIndices.push(index);
    current.chunks.push({ chunkId, text: chunk });
    current.estimatedInputTokens = joinedTokens;
  }

  if (current) packs.push(current);
  return packs;
}
