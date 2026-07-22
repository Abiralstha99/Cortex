import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import type { Socket } from "socket.io-client";
import { createSocket } from "../lib/socket";

export function useSocket() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const socket: Socket = createSocket(getToken);

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

    socket.on("connect", onConnected);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("connect", onConnected);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { connected, error };
}
