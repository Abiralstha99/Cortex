import type { Request, Response } from "express";
import { Prisma } from "../../app/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import type { UpdateUserBody, UserIdParams } from "../schemas/user.js";

export async function getUser(req: Request, res: Response) {
  try {
    const { userId } = req.params as UserIdParams;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        clerkUserId: true,
        username: true,
        rating: true,
        gamesPlayed: true,
        wins: true,
        createdAt: true,
        lastActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching user: ${error}`);
    return res.status(500).json({ error: "Error fetching user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params as UserIdParams;

    // A user can only update their own profile.
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { username } = req.body as UpdateUserBody;

    const updatedUser = await prisma.user.update({
      where: { clerkUserId: userId },
      data: { username },
      select: {
        id: true,
        username: true,
        rating: true,
        gamesPlayed: true,
        wins: true,
        createdAt: true,
        lastActive: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "User not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    console.error(`Error updating user: ${error}`);
    return res.status(500).json({ error: "Error updating user" });
  }
}
