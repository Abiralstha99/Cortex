import assert from "node:assert/strict";
import { test } from "node:test";

test("practice sessions enforce access, safe projection, concurrency, submission and cascade", { skip: process.env.RUN_PRACTICE_INTEGRATION_TESTS !== "true" }, async () => {
  const { prisma } = await import("../../lib/prisma.js");
  const practice = await import("../practice.service.js");
  const suffix = crypto.randomUUID().slice(0, 8);
  const owner = await prisma.user.create({ data: { clerkUserId: `practice-owner-${suffix}`, username: `owner${suffix}`, email: `owner-${suffix}@example.test` } });
  const player = await prisma.user.create({ data: { clerkUserId: `practice-player-${suffix}`, username: `player${suffix}`, email: `player-${suffix}@example.test` } });
  const stranger = await prisma.user.create({ data: { clerkUserId: `practice-stranger-${suffix}`, username: `strange${suffix}`, email: `stranger-${suffix}@example.test` } });
  const quiz = await prisma.quiz.create({ data: { ownerId: owner.id, title: "Practice test", sourceType: "text", questionCount: 3,
    questions: { create: [
      { type: "MCQ", position: 0, question: "Which answer is two?", explanation: "Two is the second option.", content: { options: ["one", "two", "three", "four"], correctIndex: 1 } },
      { type: "TRUE_FALSE", position: 1, question: "Is the sky blue?", explanation: "It appears blue in daylight.", content: { correctAnswer: true } },
      { type: "FILL_BLANK", position: 2, question: "Name the database system?", explanation: "PostgreSQL is the database.", content: { acceptedAnswers: ["Postgre SQL"] } },
    ] } }, include: { questions: true } });
  try {
    await assert.rejects(practice.startPractice(stranger.id, quiz.id), { status: 404 });
    const game = await prisma.game.create({ data: { roomCode: suffix.slice(0, 6).toUpperCase(), quizId: quiz.id, hostId: owner.id, status: "finished", gamePlayers: { create: { userId: player.id } } } });
    const played = await practice.listPracticeLibrary(player.id);
    assert.equal(played.played[0]?.id, quiz.id);
    await prisma.game.delete({ where: { id: game.id } });
    const [first, second] = await Promise.all([practice.startPractice(owner.id, quiz.id), practice.startPractice(owner.id, quiz.id)]);
    assert.equal(first.id, second.id);
    assert.equal(first.questions.length, 3);
    assert.equal(new Set(first.questions.map((q) => q.id)).size, 3);
    assert.equal(JSON.stringify(first).includes("correctIndex"), false);
    assert.equal(JSON.stringify(first).includes("explanation"), false);
    await assert.rejects(practice.savePracticeAnswer(stranger.id, first.id, first.questions[0]!.id, { answer: true }), { status: 404 });
    const byType = new Map(first.questions.map((q) => [q.type, q]));
    const mcq = byType.get("MCQ")!; const tf = byType.get("TRUE_FALSE")!; const fill = byType.get("FILL_BLANK")!;
    await assert.rejects(practice.savePracticeAnswer(owner.id, first.id, mcq.id, { selectedIndex: 9 }), { status: 400 });
    await practice.savePracticeAnswer(owner.id, first.id, mcq.id, { selectedIndex: 1 });
    await practice.savePracticeAnswer(owner.id, first.id, tf.id, { answer: true });
    await assert.rejects(practice.submitPractice(owner.id, first.id), { status: 409 });
    const result = await practice.submitPractice(owner.id, first.id, { questionId: fill.id, answer: { answer: "post GRE sql" } });
    assert.equal(result.score, 3);
    assert.equal(result.answers.length, 3);
    assert.equal(result.questions.some((q) => "explanation" in q && Boolean(q.explanation)), true);
    assert.deepEqual(await practice.submitPractice(owner.id, first.id), result);
    await assert.rejects(practice.savePracticeAnswer(owner.id, first.id, mcq.id, { selectedIndex: 0 }), { status: 409 });
    const fresh = await practice.startPractice(owner.id, quiz.id, true);
    assert.notEqual(fresh.id, first.id);
    assert.equal((await practice.latestPracticeResult(owner.id, quiz.id)).id, first.id);
    await practice.savePracticeAnswer(owner.id, fresh.id, mcq.id, { selectedIndex: 0 });
    await practice.savePracticeAnswer(owner.id, fresh.id, tf.id, { answer: true });
    await practice.savePracticeAnswer(owner.id, fresh.id, fill.id, { answer: "PostgreSQL" });
    const secondResult = await practice.submitPractice(owner.id, fresh.id);
    assert.equal(secondResult.score, 2);
    assert.equal((await practice.latestPracticeResult(owner.id, quiz.id)).id, fresh.id);
    const [restartA, restartB] = await Promise.all([
      practice.startPractice(owner.id, quiz.id, true), practice.startPractice(owner.id, quiz.id, true),
    ]);
    assert.notEqual(restartA.id, restartB.id);
    assert.equal(await prisma.practiceSession.count({ where: { userId: owner.id, quizId: quiz.id, status: "IN_PROGRESS" } }), 1);
    const current = await practice.startPractice(owner.id, quiz.id);
    await practice.savePracticeAnswer(owner.id, current.id, mcq.id, { selectedIndex: 1 });
    await practice.savePracticeAnswer(owner.id, current.id, tf.id, { answer: true });
    await practice.savePracticeAnswer(owner.id, current.id, fill.id, { answer: "PostgreSQL" });
    const raced = await Promise.allSettled([
      practice.savePracticeAnswer(owner.id, current.id, mcq.id, { selectedIndex: 0 }),
      practice.submitPractice(owner.id, current.id),
    ]);
    assert.equal(raced[1]?.status, "fulfilled");
    const final = await practice.getPracticeSession(owner.id, current.id);
    assert.equal(final.status, "COMPLETED");
    const selected = final.answers.find((answer) => answer.questionId === mcq.id)?.answer as { selectedIndex: number };
    assert.equal(final.score, selected.selectedIndex === 1 ? 3 : 2);
    const finishing = await practice.startPractice(owner.id, quiz.id);
    let restartPromise!: ReturnType<typeof practice.startPractice>;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM practice_sessions WHERE id = ${finishing.id}::uuid FOR UPDATE`;
      restartPromise = practice.startPractice(owner.id, quiz.id, true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await tx.practiceSession.update({ where: { id: finishing.id }, data: { status: "COMPLETED", score: 0, completedAt: new Date() } });
    });
    await restartPromise;
    assert.equal(await prisma.practiceSession.count({ where: { id: finishing.id, status: "COMPLETED" } }), 1);
    await prisma.quiz.delete({ where: { id: quiz.id } });
    assert.equal(await prisma.practiceSession.count({ where: { quizId: quiz.id } }), 0);
    assert.equal(await prisma.practiceAnswer.count({ where: { sessionId: first.id } }), 0);
  } finally {
    await prisma.quiz.deleteMany({ where: { id: quiz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, player.id, stranger.id] } } });
  }
});
