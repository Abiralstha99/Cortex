import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { clearPracticeAnswer, getPracticeSession, latestPracticeResult, listPracticeLibrary, PracticeError, practiceUser, savePracticeAnswer, startPractice, submitPractice } from "../services/practice.service.js";
import { deleteQuiz } from "../services/quiz/persist.service.js";

const router = Router();
router.use(requireAuth);
const uuid = z.string().uuid();
type Handler = (req: Request, userId: string) => Promise<unknown>;

function route(handler: Handler, noContent = false) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
      const userId = await practiceUser(req.userId);
      const result = await handler(req, userId);
      return noContent ? res.status(204).send() : res.json(result);
    } catch (error) {
      if (error instanceof PracticeError) return res.status(error.status).json({ error: error.message });
      console.error("practice request failed", error);
      return res.status(500).json({ error: "Could not complete practice request" });
    }
  };
}

function param(req: Request, key: string) {
  const value = uuid.safeParse(req.params[key]);
  if (!value.success) throw new PracticeError(400, `Invalid ${key}`);
  return value.data;
}

router.get("/library", route((_req, userId) => listPracticeLibrary(userId)));
router.delete("/quizzes/:quizId", route(async (req, userId) => {
  const result = await deleteQuiz(param(req, "quizId"), userId, true);
  if (result === "missing") throw new PracticeError(404, "Quiz not found");
  if (result === "not_solo") throw new PracticeError(403, "Only solo practice quizzes can be deleted here");
  if (result === "in_use") throw new PracticeError(409, "This quiz is used by a room or saved game and cannot be deleted");
}, true));
router.post("/quizzes/:quizId/sessions", route((req, userId) => startPractice(userId, param(req, "quizId"))));
router.post("/quizzes/:quizId/start-fresh", route((req, userId) => startPractice(userId, param(req, "quizId"), true)));
router.get("/quizzes/:quizId/results/latest", route((req, userId) => latestPracticeResult(userId, param(req, "quizId"))));
router.get("/sessions/:sessionId", route((req, userId) => getPracticeSession(userId, param(req, "sessionId"))));
router.put("/sessions/:sessionId/answers/:questionId", route((req, userId) => savePracticeAnswer(userId, param(req, "sessionId"), param(req, "questionId"), req.body)));
router.delete("/sessions/:sessionId/answers/:questionId", route((req, userId) => clearPracticeAnswer(userId, param(req, "sessionId"), param(req, "questionId")), true));
router.post("/sessions/:sessionId/submit", route((req, userId) => {
  const parsed = z.object({ pending: z.object({ questionId: uuid, answer: z.unknown() }).strict() }).strict().safeParse(req.body ?? {});
  if (!parsed.success && Object.keys(req.body ?? {}).length) throw new PracticeError(400, "Invalid pending answer");
  return submitPractice(userId, param(req, "sessionId"), parsed.success ? parsed.data.pending : undefined);
}));

export default router;
