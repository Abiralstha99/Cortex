import { Router } from "express";
import multer from "multer";
import {
  createGame,
  failWaitingQuiz,
  generateForWaitingGame,
  listPublicWaiting,
} from "../controllers/game.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  CreateWaitingGameSchema,
  FailWaitingQuizSchema,
  WaitingGameIdParamsSchema,
} from "../schemas/game.js";

const gameRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

gameRouter.post(
  "/waiting/",
  requireAuth,
  validateBody(CreateWaitingGameSchema),
  createGame,
);

gameRouter.get("/waiting/public", requireAuth, listPublicWaiting);

gameRouter.post(
  "/waiting/:gameId/generate",
  requireAuth,
  validateParams(WaitingGameIdParamsSchema),
  upload.single("file"),
  generateForWaitingGame,
);

gameRouter.post(
  "/waiting/:gameId/quiz/fail",
  requireAuth,
  validateParams(WaitingGameIdParamsSchema),
  validateBody(FailWaitingQuizSchema),
  failWaitingQuiz,
);

export default gameRouter;
