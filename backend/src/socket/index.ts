// This file sets up socket.io server on top of the express server
import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { SocketAuth } from "./auth.js";
import { registerLobbyHandlers } from "./lobbyHandler.js";

export function attachSocket(httpServer: HTTPServer): Server {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  io.use(SocketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.username} connected`);
    registerLobbyHandlers(io, socket);
  });

  return io;
}
