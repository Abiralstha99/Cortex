import { verifyWebhook } from "@clerk/express/webhooks";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/*
 * Resolve the username for a user.
 * @param username - The username to resolve.
 * @param email - The email of the user.
 * @param clerkUserId - The ID of the user.
 * @returns The resolved username.
 */
function resolveUsername(
  username: string | null,
  email: string,
  clerkUserId: string,
): string {
  const fallback = email.split("@")[0] || `user_${clerkUserId.slice(-8)}`;
  return (username ?? fallback).slice(0, 20);
}

export async function handleClerkWebhook(req: Request, res: Response) {
  console.log("=== WEBHOOK HIT ===");
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

  if (event.type === "user.updated") {
    try {
      const { id, email_addresses, primary_email_address_id, username } =
        event.data;

      const email = email_addresses.find(
        (e) => e.id === primary_email_address_id,
      )?.email_address;

      // Only sync fields Clerk actually sent a valid value for — a partial
      // update event shouldn't blow away existing data with null/empty values.
      const data: { email?: string; username?: string } = {};
      if (email) data.email = email;
      if (username) data.username = resolveUsername(username, email ?? "", id);

      const { count } = await prisma.user.updateMany({
        where: { clerkUserId: id },
        data,
      });

      if (count === 0) {
        console.log(`user.updated ignored: no user found for ${id}`);
      } else {
        console.log(`User updated: ${id}`);
      }
    } catch (error) {
      console.error(`Error updating user: ${error}`);
      return res.status(500).json({ error: "Error updating user" });
    }
  }

  if (event.type === "user.deleted") {
    try {
      const { id } = event.data;

      if (!id) {
        console.log("user.deleted ignored: missing user id");
        return res.status(200).json({ message: "Webhook received" });
      }

      // deleteMany rather than delete — repeated delivery of the same event
      // (or a delete for a user we never persisted) must not error.
      const { count } = await prisma.user.deleteMany({
        where: { clerkUserId: id },
      });

      console.log(
        count > 0
          ? `User deleted: ${id}`
          : `user.deleted ignored: no user found for ${id}`,
      );
    } catch (error) {
      console.error(`Error deleting user: ${error}`);
      return res.status(500).json({ error: "Error deleting user" });
    }
  }

  return res.status(200).json({ message: "Webhook received" });
}
