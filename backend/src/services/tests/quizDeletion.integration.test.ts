import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

const enabled = process.env.RUN_PRACTICE_INTEGRATION_TESTS === "true";

test("quiz deletion serializes with saved-room creation and generated attachment", { skip: !enabled }, async () => {
  const { prisma } = await import("../../lib/prisma.js");
  const redis = (await import("../../lib/redis.js")).default;
  const { GAME_KEY, ROOM_CODE_KEY } = await import("../../lib/redisKeys.js");
  const { createWaitingGame } = await import("../game.service.js");
  const { deleteQuiz, getAllQuizzes } = await import("../quiz/persist.service.js");
  const { listPracticeLibrary } = await import("../practice.service.js");
  const { attachQuizToWaitingGame } = await import("../waitingQuiz.service.js");
  const suffix = crypto.randomUUID().slice(0, 8);
  const owner = await prisma.user.create({ data: { clerkUserId: `lock-${suffix}`, username: `lock${suffix}`, email: `lock-${suffix}@example.test` } });
  const makeQuiz = () => prisma.quiz.create({ data: { ownerId: owner.id, title: "Lock test", sourceType: "text", status: "ready", questionCount: 1 } });
  const rooms: Array<{ gameId: string; roomCode: string }> = [];
  try {
    assert.equal(await deleteQuiz("invalid-quiz-id", owner.id), "missing");
    const multiplayer = await makeQuiz();
    assert.equal(await deleteQuiz(multiplayer.id, owner.id, true), "not_solo");
    const solo = await prisma.quiz.create({ data: { ownerId: owner.id, title: "Solo notes", sourceType: "text", status: "ready", classification: "SOLO_ONLY", questionCount: 1 } });
    const question = await prisma.question.create({ data: { quizId: solo.id, type: "TRUE_FALSE", question: "Is this solo?", content: { correctAnswer: true }, explanation: "Yes, it is solo.", position: 0 } });
    const chunk = await prisma.sourceChunk.create({ data: { quizId: solo.id, chunkId: "chunk-1", text: "solo source" } });
    await prisma.questionSource.create({ data: { questionId: question.id, sourceChunkId: chunk.id, quote: "solo source" } });
    const session = await prisma.practiceSession.create({ data: { userId: owner.id, quizId: solo.id, questionOrder: [question.id] } });
    await prisma.practiceAnswer.create({ data: { sessionId: session.id, questionId: question.id, submittedAnswer: { answer: true } } });
    assert.equal((await listPracticeLibrary(owner.id)).created.find((quiz) => quiz.id === solo.id)?.classification, "SOLO_ONLY");
    assert.equal((await getAllQuizzes(owner.id)).some((quiz) => quiz.id === solo.id), false);
    await assert.rejects(createWaitingGame({ hostId: owner.id, hostUsername: owner.username, quizId: solo.id, rounds: 1, maxPlayers: 2 }), /solo practice only/i);
    const soloWaiting = await createWaitingGame({ hostId: owner.id, hostUsername: owner.username, rounds: 1, maxPlayers: 2 });
    rooms.push(soloWaiting);
    assert.equal((await attachQuizToWaitingGame(soloWaiting.gameId, solo.id, 1)).quizGenStatus, "failed");
    assert.equal(await deleteQuiz(solo.id, owner.id, true), "deleted");
    assert.equal(await prisma.question.count({ where: { quizId: solo.id } }), 0);
    assert.equal(await prisma.practiceSession.count({ where: { quizId: solo.id } }), 0);
    assert.equal(await prisma.practiceAnswer.count({ where: { sessionId: session.id } }), 0);
    assert.equal(await prisma.questionSource.count({ where: { questionId: question.id } }), 0);
    assert.equal(await prisma.sourceChunk.count({ where: { quizId: solo.id } }), 0);
    const first = await makeQuiz();
    const room = await createWaitingGame({ hostId: owner.id, hostUsername: owner.username, quizId: first.id, rounds: 1, maxPlayers: 2 });
    rooms.push(room);
    assert.equal(await deleteQuiz(first.id, owner.id), "in_use");
    assert.equal(await redis.hget(GAME_KEY(room.gameId), "quizId"), first.id);

    const saved = await makeQuiz();
    const game = await prisma.game.create({ data: { roomCode: suffix.slice(0, 6).toUpperCase(), quizId: saved.id, hostId: owner.id, status: "finished" } });
    assert.equal(await deleteQuiz(saved.id, owner.id), "in_use");
    await prisma.game.delete({ where: { id: game.id } });

    const second = await makeQuiz();
    assert.equal(await deleteQuiz(second.id, owner.id), "deleted");
    await assert.rejects(createWaitingGame({ hostId: owner.id, hostUsername: owner.username, quizId: second.id, rounds: 1, maxPlayers: 2 }), /Quiz not found/);

    const third = await makeQuiz();
    const generated = await createWaitingGame({ hostId: owner.id, hostUsername: owner.username, rounds: 1, maxPlayers: 2 });
    rooms.push(generated);
    assert.equal(await deleteQuiz(third.id, owner.id), "deleted");
    const failed = await attachQuizToWaitingGame(generated.gameId, third.id, 1);
    assert.equal(failed.quizGenStatus, "failed");
    assert.equal(await redis.hget(GAME_KEY(generated.gameId), "quizId"), "");

    const fourth = await makeQuiz();
    const generatedFirst = await createWaitingGame({ hostId: owner.id, hostUsername: owner.username, rounds: 1, maxPlayers: 2 });
    rooms.push(generatedFirst);
    const attached = await attachQuizToWaitingGame(generatedFirst.gameId, fourth.id, 1);
    assert.equal(attached.quizGenStatus, "ready");
    assert.equal(await deleteQuiz(fourth.id, owner.id), "in_use");

    const racedQuiz = await makeQuiz();
    const [created, deleted] = await Promise.allSettled([
      createWaitingGame({ hostId: owner.id, hostUsername: owner.username, quizId: racedQuiz.id, rounds: 1, maxPlayers: 2 }),
      deleteQuiz(racedQuiz.id, owner.id),
    ]);
    if (created.status === "fulfilled") {
      rooms.push(created.value);
      assert.deepEqual(deleted, { status: "fulfilled", value: "in_use" });
      assert.equal(await redis.hget(GAME_KEY(created.value.gameId), "quizId"), racedQuiz.id);
    } else {
      assert.match(String(created.reason), /Quiz not found/);
      assert.deepEqual(deleted, { status: "fulfilled", value: "deleted" });
    }

    const originalTransaction = prisma.$transaction.bind(prisma);
    const forceCommitFailure = () => Object.defineProperty(prisma, "$transaction", { configurable: true, value: async (operation: Parameters<typeof originalTransaction>[0]) => {
      await originalTransaction(operation);
      throw new Error("Simulated transaction failure after Redis write");
    } });
    const restoreTransaction = () => Object.defineProperty(prisma, "$transaction", { configurable: true, value: originalTransaction });

    const failedRoomQuiz = await makeQuiz();
    try {
      forceCommitFailure();
      await assert.rejects(createWaitingGame({ hostId: owner.id, hostUsername: owner.username, quizId: failedRoomQuiz.id, rounds: 1, maxPlayers: 2 }), /Simulated transaction failure/);
    } finally { restoreTransaction(); }
    const hashes = await redis.keys("game:*");
    for (const key of hashes) {
      if (await redis.type(key) === "hash") assert.notEqual(await redis.hget(key, "quizId"), failedRoomQuiz.id);
    }

    const failedAttachQuiz = await makeQuiz();
    const failedAttachRoom = await createWaitingGame({ hostId: owner.id, hostUsername: owner.username, rounds: 1, maxPlayers: 2 });
    rooms.push(failedAttachRoom);
    try {
      forceCommitFailure();
      const payload = await attachQuizToWaitingGame(failedAttachRoom.gameId, failedAttachQuiz.id, 1);
      assert.equal(payload.quizGenStatus, "failed");
    } finally { restoreTransaction(); }
    assert.equal(await redis.hget(GAME_KEY(failedAttachRoom.gameId), "quizId"), "");
  } finally {
    for (const room of rooms) await redis.del(GAME_KEY(room.gameId), ROOM_CODE_KEY(room.roomCode));
    await prisma.quiz.deleteMany({ where: { ownerId: owner.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await redis.quit();
  }
});
