// This middleware is used to authenticate the socket connection 
// When someone connects to the socket, the socket.io server will call this middleware to authenticate the connection
import { verifyToken } from "@clerk/express";
import type { Socket } from "socket.io";

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

    if (!session.sub) {
      return next(new Error("Authentication error"));
    }

    // Attach the user information to the socket for later use
    socket.data.username = session.sub;
    next();
  } catch (error) {
    console.log("Authentication error", error);
    next(new Error("Authentication error"));
  }
}
