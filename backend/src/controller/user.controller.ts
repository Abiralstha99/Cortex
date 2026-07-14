import type { Request, Response } from "express";
import { Prisma } from "../../app/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
type UserParams = {
  userId: string;
};

export async function getUser(req: Request<UserParams>, res: Response) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing user id" });
    }

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
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing user id" });
    }

    // A user can only update their own profile.
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { username } = req.body ?? {};

    if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
      return res.status(400).json({
        error:
          "username must be 3-20 characters and contain only letters, numbers, and underscores",
      });
    }

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
