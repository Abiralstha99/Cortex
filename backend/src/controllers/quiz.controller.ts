import type { Request, Response } from "express";
import { GenerateCountSchema } from "../schemas/quiz.js";
import { prisma } from "../lib/prisma.js";
import { runQuizGeneration } from "../services/quiz/pipeline.js";
import {
  getQuizGenJob,
  getQuiz as getQuizForOwner,
  getAllQuizzes,
} from "../services/quiz/persist.service.js";

async function resolveOwnerId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  return user?.id ?? null;
}

export async function generateQuiz(req: Request, res: Response) {
  try {
    // Require authenticated user and resolve internal owner ID
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ownerId = await resolveOwnerId(req.userId);
    if (!ownerId) {
      return res.status(404).json({ error: "User not found" });
    }

    // Require uploaded file
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    // Validate requested question count
    const countResult = GenerateCountSchema.safeParse(req.body?.count);
    if (!countResult.success) {
      return res
        .status(400)
        .json({ error: "Invalid count", details: countResult.error.issues });
    }

    // Run the quiz generation pipeline (sync or async depending on size)
    const result = await runQuizGeneration({
      ownerId,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      requestedCount: countResult.data,
    });

    // Sync path → 200 with quiz data
    if (result.mode === "sync") {
      return res.status(200).json({
        quizId: result.quizId,
        status: result.status,
        questions: result.questions,
        metadata: result.metadata,
      });
    }

    // Async path → 202 with job ID for polling
    return res.status(202).json({
      jobId: result.jobId,
      status: result.status,
      metadata: result.metadata,
    });
  } catch (error) {
    // Map known error messages to appropriate HTTP status codes
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("already in progress")) {
      return res.status(409).json({ error: message });
    }
    if (
      message.includes("too short") ||
      message.includes("No batches generated") ||
      message.includes("No planned LLM calls") ||
      message.includes("Requested count must be")
    ) {
      return res.status(400).json({ error: message });
    }
    if (
      message.includes("Failed to parse PDF") ||
      message.includes("Unsupported file type") ||
      message.includes("no readable text")
    ) {
      return res.status(422).json({ error: message });
    }

    console.error("generateQuiz error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** GET /api/quiz/jobs/:jobId — poll Redis job (owner-scoped). */
export async function getQuizJob(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ownerId = await resolveOwnerId(req.userId);
    if (!ownerId) {
      return res.status(404).json({ error: "User not found" });
    }

    const { jobId } = req.params as { jobId: string };
    const job = await getQuizGenJob(jobId);

    // Job not found or belongs to a different owner
    if (!job || job.ownerId !== ownerId) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(200).json(job);
  } catch (error) {
    console.error("getQuizJob error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** GET /api/quizzes — list user's ready quizzes. */
export async function getAllQuiz(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ownerId = await resolveOwnerId(req.userId);
    if (!ownerId) {
      return res.status(404).json({ error: "User not found" });
    }

    const quizzes = await getAllQuizzes(ownerId);
    return res.status(200).json({ quizzes });
  } catch (error) {
    console.error("listQuizzes error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/** GET /api/quizzes/:quizId — get a quiz with questions. */
export async function getQuizById(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ownerId = await resolveOwnerId(req.userId);
    if (!ownerId) {
      return res.status(404).json({ error: "User not found" });
    }

    const { quizId } = req.params as { quizId: string };
    const quiz = await getQuizForOwner(quizId, ownerId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json(quiz);
  } catch (error) {
    console.error("getQuiz error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
