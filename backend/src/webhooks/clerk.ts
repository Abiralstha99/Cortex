import { verifyWebhook } from "@clerk/express/webhooks";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function resolveUsername(
  username: string | null,
  email: string,
  clerkUserId: string,
): string {
  const fallback = email.split("@")[0] || `user_${clerkUserId.slice(-8)}`;
  return (username ?? fallback).slice(0, 20);
}

export async function handleClerkWebhook(req: Request, res: Response) {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    return res.status(500).json({ error: "CLERK_WEBHOOK_SECRET is not set" });
  }

  let event;
  try {
    // Uses the raw request body + Svix headers. Requires express.raw() on this route.
    event = await verifyWebhook(req, { signingSecret });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).json({ error: "Invalid SVIX signature" });
  }

  if (event.type === "user.created") {
    try {
      const { id, email_addresses, primary_email_address_id, username } =
        event.data;

      const email =
        email_addresses.find((e) => e.id === primary_email_address_id)
          ?.email_address ?? email_addresses[0]?.email_address;

      if (!email) {
        return res.status(400).json({ error: "User has no email address" });
      }

      const newUser = await prisma.user.upsert({
        where: { clerkUserId: id },
        update: {},
        create: {
          clerkUserId: id,
          email,
          username: resolveUsername(username, email, id),
        },
      });

      console.log(`User created: ${newUser.id}`);
    } catch (error) {
      console.error(`Error creating user: ${error}`);
      return res.status(500).json({ error: "Error creating user" });
    }
  }

  return res.status(200).json({ message: "Webhook received" });
}
