// This middleware is used to authenticate the socket connection
// When someone connects to the socket, the socket.io server will call this middleware to authenticate the connection
import { verifyToken } from "@clerk/express";
import type { Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";

export async function SocketAuth(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    // Verify the Clerk token
    //  Session returns the user's information
    const session = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = session.sub;

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, username: true },
    });
    if (!user) {
      return next(new Error("User not found")); // webhook race — same risk as REST
    }
    // Attach the user information to the socket for later use
    socket.data.clerkUserId = clerkUserId;
    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.gameId = null;
    next();
  } catch (error) {
    console.log("Authentication error", error);
    next(new Error("Authentication error"));
  }
}
