import type { Prisma } from "../../../app/generated/prisma/client.js";

/** The row lock serializes durable quiz deletion with Redis room binding. */
export async function lockQuizRow(tx: Prisma.TransactionClient, quizId: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quizId)) return false;
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM quizzes WHERE id = ${quizId}::uuid FOR UPDATE`;
  return rows.length > 0;
}
