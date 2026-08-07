// LangChain does the first rough split, then the code adjusts those chunks based on estimated tokens.

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { estimateTokens } from "./tokens.js";
import { ChunkError } from "./errors.js";

const MIN_CHUNK_TOKENS = 200;
const MAX_CHUNK_TOKENS = 800;
/** Splitter sizes in characters; splitter is first cut, then we merge/split by token estimate. */
const SPLITTER_CHUNK_CHARS = 1800;
const SPLITTER_OVERLAP_CHARS = 200;

export async function chunkText(text: string): Promise<string[]> {
  const trimmed = text.trim();
  if (estimateTokens(trimmed) < 50) {
    throw new ChunkError("Text too short to chunk");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: SPLITTER_CHUNK_CHARS,
    chunkOverlap: SPLITTER_OVERLAP_CHARS,
    separators: ["\n## ", "\n# ", "\n### ", "\n\n", "\n", ". ", " ", ""],
  });

  const docs = await splitter.createDocuments([trimmed]);

  // Filtering removes empty chunks
  let pieces = docs.map((d) => d.pageContent.trim()).filter(Boolean);

  // Merge undersized tail chunks into previous
  const merged: string[] = [];
  for (const piece of pieces) {
    if (merged.length === 0) {
      merged.push(piece);
      continue;
    }
    const last = merged[merged.length - 1]!;
    if (estimateTokens(piece) < MIN_CHUNK_TOKENS) {
      merged[merged.length - 1] = `${last}\n\n${piece}`;
    } else {
      merged.push(piece);
    }
  }

  // Split oversized by sentences
  const finalChunks: string[] = [];
  for (const chunk of merged) {
    if (estimateTokens(chunk) <= MAX_CHUNK_TOKENS) {
      finalChunks.push(chunk);
      continue;
    }
    finalChunks.push(...splitOversized(chunk, MAX_CHUNK_TOKENS));
  }

  if (finalChunks.length === 0) {
    throw new ChunkError("No chunks produced");
  }

  return finalChunks;
}

function splitOversized(text: string, maxTokens: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (estimateTokens(candidate) > maxTokens && current) {
      out.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.length > 0 ? out : [text];
}