import type { PracticeAnswer } from "@/lib/api";

export function samePracticeAnswer(a: PracticeAnswer | null, b: PracticeAnswer | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function resumePracticeIndex(order: string[], answered: string[]): number {
  const saved = new Set(answered);
  return order.findIndex((id) => !saved.has(id));
}
