import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

type ClerkProfile = {
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
};

type LocalUserDependencies = {
  find: (clerkUserId: string) => Promise<{ id: string } | null>;
  fetch: (clerkUserId: string) => Promise<ClerkProfile>;
  upsert: (clerkUserId: string, email: string, username: string) => Promise<{ id: string }>;
};

const localUserDependencies: LocalUserDependencies = {
  find: (clerkUserId) => prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } }),
  fetch: (clerkUserId) => clerkClient.users.getUser(clerkUserId),
  upsert: (clerkUserId, email, username) => prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId, email, username },
    select: { id: true },
  }),
};

export async function ensureLocalUser(
  clerkUserId: string,
  dependencies: LocalUserDependencies = localUserDependencies,
): Promise<{ id: string }> {
  const existing = await dependencies.find(clerkUserId);
  if (existing) return existing;

  const profile = await dependencies.fetch(clerkUserId);
  const email = profile.primaryEmailAddress?.emailAddress ?? profile.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Clerk user has no email address");
  const username = (profile.username || email.split("@")[0] || `user_${clerkUserId.slice(-8)}`).slice(0, 20);
  return dependencies.upsert(clerkUserId, email, username);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await ensureLocalUser(userId);
    req.userId = userId;
    next();
  } catch (error) {
    console.error("Could not provision authenticated user", error);
    res.status(503).json({ error: "Could not prepare user account" });
  }
}
