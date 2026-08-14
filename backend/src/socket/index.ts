// This file sets up socket.io server on top of the express server
import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { SocketAuth } from "./auth.js";
import { registerLobbyHandlers } from "./lobbyHandler.js";
import { registerGameHandlers } from "./gameHandler.js";

let ioInstance: Server | undefined;

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io server has not been initialized");
  }
  return ioInstance;
}

export function attachSocket(httpServer: HTTPServer): Server {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });
  ioInstance = io;

  io.use(SocketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.username} connected`);
    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
  });

  return io;
}
