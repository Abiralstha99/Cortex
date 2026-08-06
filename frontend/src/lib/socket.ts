// This file manages a singleton socket connection that persists across page navigations
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type GetToken = () => Promise<string|null>;

// Singleton socket instance that persists across component mounts/unmounts
let socketInstance: Socket | null = null;
let currentGetToken: GetToken | null = null;

export function createSocket(getToken: GetToken): Socket {
  // If socket already exists, return it (whether connected or connecting)
  if (socketInstance) {
    // Update the getToken function in case auth needs to refresh
    currentGetToken = getToken;
    return socketInstance;
  }

  // Store the getToken function
  currentGetToken = getToken;

  // Create new socket instance
  socketInstance = io(API_URL, {
    // We don't want to connect automatically, we want to connect when the user is authenticated
    autoConnect: false,
    auth: async (cb) => {
      // Use the stored getToken function (in case it was updated)
      const token = currentGetToken ? await currentGetToken() : null;
      cb({ token });
    },
  });

  return socketInstance;
}

// Export function to get the existing socket instance (for debugging)
export function getSocket(): Socket | null {
  return socketInstance;
}
