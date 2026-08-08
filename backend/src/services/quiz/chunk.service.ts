import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { estimateTokens } from "./tokens.js";

const MIN_CHUNK_TOKENS = 200;
const MAX_CHUNK_TOKENS = 800;
/** Splitter sizes in characters; first cut only — merge/split uses token estimates. */
const SPLITTER_CHUNK_CHARS = 1800;
const SPLITTER_OVERLAP_CHARS = 200;

/**
 * Split cleaned source text into chunks sized for quiz generation.
 * Uses LangChain for a rough split, then merges short pieces and splits oversized ones.
 */
export async function chunkText(text: string): Promise<string[]> {
  const trimmed = text.trim();
  if (estimateTokens(trimmed) < 50) {
    throw new Error("Text too short to chunk");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: SPLITTER_CHUNK_CHARS,
    chunkOverlap: SPLITTER_OVERLAP_CHARS,
    separators: ["\n## ", "\n# ", "\n### ", "\n\n", "\n", ". ", " ", ""],
  });

  const docs = await splitter.createDocuments([trimmed]);
  const pieces = docs.map((d) => d.pageContent.trim()).filter(Boolean);
  const merged = mergeUndersizedChunks(pieces);
  const finalChunks = splitOversizedChunks(merged);

  if (finalChunks.length === 0) {
    throw new Error("No chunks produced");
  }

  return finalChunks;
}

function mergeUndersizedChunks(pieces: string[]): string[] {
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
  return merged;
}

function splitOversizedChunks(chunks: string[]): string[] {
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (estimateTokens(chunk) <= MAX_CHUNK_TOKENS) {
      finalChunks.push(chunk);
    } else {
      finalChunks.push(...splitOversized(chunk, MAX_CHUNK_TOKENS));
    }
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
