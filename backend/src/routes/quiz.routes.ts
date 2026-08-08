import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validateParams } from "../middleware/validate.middleware.js";
import { JobIdParamsSchema, QuizIdParamsSchema } from "../schemas/quiz.js";
import {
  generateQuiz,
  getQuizById,
  getQuizJob,
  getAllQuiz,
} from "../controllers/quiz.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/** POST /api/quiz/generate, GET /api/quiz/jobs/:jobId */
export const quizGenerateRouter = Router();
quizGenerateRouter.post(
  "/generate",
  requireAuth,
  upload.single("file"),
  generateQuiz,
);
quizGenerateRouter.get(
  "/jobs/:jobId",
  requireAuth,
  validateParams(JobIdParamsSchema),
  getQuizJob,
);

/** GET /api/quizzes and GET /api/quizzes/:quizId (Postgres ready quizzes) */
export const quizzesRouter = Router();
quizzesRouter.get("/", requireAuth, getAllQuiz);
quizzesRouter.get(
  "/:quizId",
  requireAuth,
  validateParams(QuizIdParamsSchema),
  getQuizById,
);

export default quizzesRouter;
