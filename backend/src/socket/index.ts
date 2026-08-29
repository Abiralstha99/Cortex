// This file sets up socket.io server on top of the express server
import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { SocketAuth } from "./auth.js";
import { registerLobbyHandlers } from "./lobbyHandler.js";
import { registerGameHandlers } from "./gameHandler.js";
import { registerPublicWaitingHandlers } from "./publicWaiting.js";
import { socketCorsOptions } from "../lib/cors.js";

let ioInstance: Server | undefined;

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io server has not been initialized");
  }
  return ioInstance;
}

export function attachSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: socketCorsOptions,
  });
  ioInstance = io;

  io.use(SocketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.username} connected`);
    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerPublicWaitingHandlers(socket);
  });

  return io;
}
