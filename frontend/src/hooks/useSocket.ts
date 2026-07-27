import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import type { Socket } from "socket.io-client";
import { createSocket } from "../lib/socket";

export function useSocket() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const newSocket: Socket = createSocket(getToken);

    const onConnected = () => {
      setConnected(true);
      setError(null);
    };

    const onConnectError = (err: Error) => {
      setConnected(false);
      setError(err.message);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    newSocket.on("connect", onConnected);
    newSocket.on("connect_error", onConnectError);
    newSocket.on("disconnect", onDisconnect);
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.off("connect", onConnected);
      newSocket.off("connect_error", onConnectError);
      newSocket.off("disconnect", onDisconnect);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { socket, connected, error };
}
