import { prisma } from "../lib/prisma.js";
import { QuestionContentSchema } from "../schemas/quiz.js";
import { correctAnswerLabel } from "./questionAnswer.service.js";
import { gradePracticeAnswer, publicPracticeQuestion, resumePosition, validatePracticeAnswer } from "./practice.logic.js";
import type { Prisma } from "../../app/generated/prisma/client.js";

export class PracticeError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Tx = Prisma.TransactionClient;
const fail = (status: number, message: string): never => { throw new PracticeError(status, message); };

export async function practiceUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
  return user?.id ?? fail(404, "User not found");
}

async function eligibleQuiz(db: Tx | typeof prisma, quizId: string, userId: string) {
  const quiz = await db.quiz.findUnique({ where: { id: quizId }, include: { questions: { orderBy: { position: "asc" } } } });
  if (!quiz || quiz.status !== "ready" || quiz.questions.length === 0 || quiz.questions.length !== quiz.questionCount) {
    return fail(404, "Quiz not available for practice");
  }
  if (quiz.ownerId !== userId) {
    const participated = await db.gamePlayer.findFirst({ where: { userId, game: { quizId, status: "finished" } }, select: { id: true } });
    if (!participated) return fail(404, "Quiz not available for practice");
  }
  return quiz;
}

async function lockedSession(tx: Tx, sessionId: string, userId: string) {
  await tx.$queryRaw`SELECT id FROM practice_sessions WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
  const session = await tx.practiceSession.findFirst({ where: { id: sessionId, userId }, include: { answers: true } });
  if (!session) return fail(404, "Practice session not found");
  const quiz = await eligibleQuiz(tx, session.quizId, userId);
  return { session, quiz };
}

function orderOf(session: { questionOrder: unknown }, questionIds: string[]) {
  const order = session.questionOrder;
  if (!Array.isArray(order) || order.length !== questionIds.length ||
    new Set(order).size !== questionIds.length || !order.every((id) => typeof id === "string" && questionIds.includes(id))) {
    return fail(409, "Practice questions have changed");
  }
  return order as string[];
}

function projectSession(session: { id: string; quizId: string; status: string; score: number | null; completedAt: Date | null; questionOrder: unknown; answers: Array<{ questionId: string; submittedAnswer: unknown; isCorrect: boolean | null }> }, quiz: Awaited<ReturnType<typeof eligibleQuiz>>) {
  const order = orderOf(session, quiz.questions.map((q) => q.id));
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  const complete = session.status === "COMPLETED";
  const questions = order.map((id) => {
    const q = byId.get(id)!;
    if (!complete) return publicPracticeQuestion(q);
    const content = QuestionContentSchema.parse({ type: q.type, content: q.content });
    return { ...publicPracticeQuestion(q), correctAnswer: correctAnswerLabel(content), explanation: q.explanation };
  });
  return {
    id: session.id, quizId: session.quizId, title: quiz.title, status: session.status,
    score: complete ? session.score : undefined, completedAt: complete ? session.completedAt : undefined,
    questions, answers: session.answers.map((a) => ({ questionId: a.questionId, answer: a.submittedAnswer, ...(complete ? { isCorrect: a.isCorrect } : {}) })),
    resumeIndex: complete ? -1 : resumePosition(order, session.answers.map((a) => a.questionId)),
  };
}

export async function listPracticeLibrary(userId: string) {
  const quizzes = await prisma.quiz.findMany({
    where: { status: "ready", OR: [{ ownerId: userId }, { games: { some: { status: "finished", gamePlayers: { some: { userId } } } } }] },
    include: { questions: { select: { id: true } }, practiceSessions: { where: { userId }, include: { _count: { select: { answers: true } } }, orderBy: [{ completedAt: "desc" }, { id: "desc" }] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const summary = (quiz: typeof quizzes[number]) => {
    const unfinished = quiz.practiceSessions.find((s) => s.status === "IN_PROGRESS");
    const latest = quiz.practiceSessions.find((s) => s.status === "COMPLETED");
    return { id: quiz.id, title: quiz.title, questionCount: quiz.questionCount, classification: quiz.classification,
      unfinished: unfinished ? { id: unfinished.id, answeredCount: unfinished._count.answers } : null,
      latestResult: latest ? { id: latest.id, score: latest.score, completedAt: latest.completedAt } : null };
  };
  const ready = quizzes.filter((q) => q.questions.length === q.questionCount && q.questions.length > 0);
  return { created: ready.filter((q) => q.ownerId === userId).map(summary), played: ready.filter((q) => q.ownerId !== userId).map(summary) };
}

export async function startPractice(userId: string, quizId: string, fresh = false) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${quizId}))`;
    const quiz = await eligibleQuiz(tx, quizId, userId);
    await tx.$queryRaw`SELECT id FROM practice_sessions WHERE user_id = ${userId}::uuid AND quiz_id = ${quizId}::uuid AND status = 'IN_PROGRESS' FOR UPDATE`;
    const existing = await tx.practiceSession.findFirst({ where: { userId, quizId, status: "IN_PROGRESS" }, include: { answers: true } });
    if (existing && !fresh) return projectSession(existing, quiz);
    if (existing) await tx.practiceSession.delete({ where: { id: existing.id } });
    const ids = quiz.questions.map((q) => q.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    }
    const session = await tx.practiceSession.create({ data: { userId, quizId, questionOrder: ids }, include: { answers: true } });
    return projectSession(session, quiz);
  });
}

export async function getPracticeSession(userId: string, sessionId: string) {
  const session = await prisma.practiceSession.findFirst({ where: { id: sessionId, userId }, include: { answers: true } });
  if (!session) return fail(404, "Practice session not found");
  const quiz = await eligibleQuiz(prisma, session.quizId, userId);
  return projectSession(session, quiz);
}

async function writeAnswer(tx: Tx, session: Awaited<ReturnType<typeof lockedSession>>["session"], quiz: Awaited<ReturnType<typeof eligibleQuiz>>, questionId: string, input: unknown) {
  if (session.status !== "IN_PROGRESS") return fail(409, "Practice session is complete");
  const order = orderOf(session, quiz.questions.map((q) => q.id));
  if (!order.includes(questionId)) return fail(404, "Question not in this practice session");
  const question = quiz.questions.find((q) => q.id === questionId)!;
  const answer = validatePracticeAnswer(question, input);
  if (!answer) return fail(400, "Invalid answer for question type");
  await tx.practiceAnswer.upsert({ where: { sessionId_questionId: { sessionId: session.id, questionId } },
    create: { sessionId: session.id, questionId, submittedAnswer: answer }, update: { submittedAnswer: answer } });
  return answer;
}

export async function savePracticeAnswer(userId: string, sessionId: string, questionId: string, input: unknown) {
  return prisma.$transaction(async (tx) => {
    const { session, quiz } = await lockedSession(tx, sessionId, userId);
    const answer = await writeAnswer(tx, session, quiz, questionId, input);
    return { questionId, answer };
  });
}

export async function clearPracticeAnswer(userId: string, sessionId: string, questionId: string) {
  return prisma.$transaction(async (tx) => {
    const { session, quiz } = await lockedSession(tx, sessionId, userId);
    if (session.status !== "IN_PROGRESS") return fail(409, "Practice session is complete");
    if (!orderOf(session, quiz.questions.map((q) => q.id)).includes(questionId)) return fail(404, "Question not in this practice session");
    await tx.practiceAnswer.deleteMany({ where: { sessionId, questionId } });
  });
}

export async function submitPractice(userId: string, sessionId: string, pending?: { questionId: string; answer: unknown }) {
  return prisma.$transaction(async (tx) => {
    const { session, quiz } = await lockedSession(tx, sessionId, userId);
    if (session.status === "COMPLETED") return projectSession(session, quiz);
    if (pending) await writeAnswer(tx, session, quiz, pending.questionId, pending.answer);
    const order = orderOf(session, quiz.questions.map((q) => q.id));
    const answers = await tx.practiceAnswer.findMany({ where: { sessionId } });
    if (answers.length !== order.length || !order.every((id) => answers.some((a) => a.questionId === id))) return fail(409, "Answer every question before submitting");
    let score = 0;
    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId)!;
      const valid = validatePracticeAnswer(question, answer.submittedAnswer);
      if (!valid) return fail(409, "A saved answer is invalid");
      const correct = gradePracticeAnswer(question, valid);
      if (correct) score++;
      await tx.practiceAnswer.update({ where: { id: answer.id }, data: { isCorrect: correct } });
    }
    await tx.practiceSession.update({ where: { id: sessionId }, data: { status: "COMPLETED", score, completedAt: new Date() } });
    const completed = await tx.practiceSession.findUniqueOrThrow({ where: { id: sessionId }, include: { answers: true } });
    return projectSession(completed, quiz);
  });
}

export async function latestPracticeResult(userId: string, quizId: string) {
  const quiz = await eligibleQuiz(prisma, quizId, userId);
  const session = await prisma.practiceSession.findFirst({ where: { userId, quizId, status: "COMPLETED" }, include: { answers: true }, orderBy: [{ completedAt: "desc" }, { id: "desc" }] });
  if (!session) return fail(404, "No practice result found");
  return projectSession(session, quiz);
}
