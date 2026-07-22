// This function creates a client side socket connection to the server
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type GetToken = () => Promise<string|null>;

export function createSocket(getToken: GetToken): Socket {
  return io(API_URL, {
    auth: async (cb) => {
      const token = await getToken();
      cb({ token });
    },
  });
}
