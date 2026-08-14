import type { Request, Response } from "express";
import { createWaitingGame } from "../services/game.service.js";
import type {
  CreateWaitingGameInput,
  FailWaitingQuizInput,
  WaitingGameIdParams,
} from "../schemas/game.js";
import { GenerateCountSchema } from "../schemas/quiz.js";
import { prisma } from "../lib/prisma.js";
import redis from "../lib/redis.js";
import { GAME_KEY } from "../lib/redisKeys.js";
import {
  markWaitingQuizFailed,
  scheduleWaitingQuizGeneration,
} from "../services/waitingQuiz.service.js";
import { getIO } from "../socket/index.js";

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

  const { quizId, rounds } = req.body as CreateWaitingGameInput;

  try {
    const game = await createWaitingGame({
      hostId: user.id,
      hostUsername: user.username,
      ...(quizId !== undefined ? { quizId } : {}),
      rounds,
    });

    res.status(201).json(game);
  } catch (error) {
    if (error instanceof Error && error.message === "Quiz not found") {
      return res.status(404).json({ message: "Quiz not found" });
    }
    if (error instanceof Error && error.message === "Quiz is not ready") {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message === "Quiz has no questions") {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

export async function generateForWaitingGame(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: req.userId },
    select: { id: true },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { gameId } = req.params as WaitingGameIdParams;
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game.gameId) {
    return res.status(404).json({ message: "Room not found" });
  }
  if (game.hostId !== user.id) {
    return res.status(403).json({ message: "Only the host can generate a quiz" });
  }
  if (game.status !== "waiting") {
    return res.status(409).json({ message: "Game has already started" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const countResult = GenerateCountSchema.safeParse(req.body?.count);
  if (!countResult.success) {
    return res.status(400).json({
      message: "Invalid count",
      errors: countResult.error.issues,
    });
  }

  const io = getIO();
  scheduleWaitingQuizGeneration({
    gameId,
    ownerId: user.id,
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
    requestedCount: countResult.data,
    onStatus: (payload) => {
      io.to(`game:${gameId}`).emit("quiz_status", payload);
    },
  });

  return res.status(202).json({ status: "processing" });
}

export async function failWaitingQuiz(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: req.userId },
    select: { id: true },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { gameId } = req.params as WaitingGameIdParams;
  const game = await redis.hgetall(GAME_KEY(gameId));
  if (!game.gameId) {
    return res.status(404).json({ message: "Room not found" });
  }
  if (game.hostId !== user.id) {
    return res.status(403).json({ message: "Only the host can update the quiz" });
  }
  if (game.status !== "waiting") {
    return res.status(409).json({ message: "Game has already started" });
  }

  const { message } = req.body as FailWaitingQuizInput;
  const payload = await markWaitingQuizFailed(gameId, message);
  if (!payload) {
    return res.status(409).json({ message: "Room is no longer waiting" });
  }

  getIO().to(`game:${gameId}`).emit("quiz_status", payload);
  return res.status(200).json(payload);
}
