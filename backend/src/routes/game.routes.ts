import { Router } from "express";
import { createGame } from "../controllers/game.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { CreateWaitingGameSchema } from "../schemas/game.js";

const gameRouter = Router();

gameRouter.post(
  "/waiting/",
  requireAuth,
  validateBody(CreateWaitingGameSchema),
  createGame,
);

export default gameRouter;
