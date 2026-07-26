import type { Request, Response } from "express";
import { createWaitingGame } from "../services/game.service.js";
import type { CreateWaitingGameInput } from "../schemas/game.js";
import { prisma } from "../lib/prisma.js";

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
