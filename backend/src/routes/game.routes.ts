import { Router } from "express";
import { createWaitingGame } from "../game/gameService.js";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  CreateWaitingGameSchema,
  type CreateWaitingGameInput,
} from "../schemas/game.js";
import { prisma } from "../lib/prisma.js";

const gameRouter = Router();

export async function createGame(req: Request, res: Response) {
  const clerkUserId = req.userId!;
  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, username: true },
  });

  if (!user) {
    return res.status(404).json({ message: "Host not found" });
  }

  const { difficulty, rounds } = req.body as CreateWaitingGameInput;

  const game = await createWaitingGame({
    hostId: user.id,
    hostUsername: user.username,
    difficulty,
    rounds,
  });

  res.status(201).json(game);
}

gameRouter.post(
  "/waiting/",
  requireAuth,
  validateBody(CreateWaitingGameSchema),
  createGame,
);

export default gameRouter;
