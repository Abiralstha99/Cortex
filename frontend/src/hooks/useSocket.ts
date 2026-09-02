import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import type { Socket } from "socket.io-client";
import { createSocket } from "../lib/socket";

export function useSocket() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const newSocket: Socket = createSocket(getToken);
    let cancelled = false;

    const onConnected = () => {
      setConnected(true);
      setActive(true);
      setError(null);
    };

    const onConnectError = (err: Error) => {
      setConnected(false);
      setActive(newSocket.active);
      setError(err.message);
    };

    const onDisconnect = () => {
      setConnected(false);
      setActive(newSocket.active);
    };

    const onReconnectAttempt = () => {
      setActive(true);
    };

    const onReconnectFailed = () => {
      setConnected(false);
      setActive(false);
    };

    newSocket.on("connect", onConnected);
    newSocket.on("connect_error", onConnectError);
    newSocket.on("disconnect", onDisconnect);
    newSocket.io.on("reconnect_attempt", onReconnectAttempt);
    newSocket.io.on("reconnect_failed", onReconnectFailed);

    // Connect if not already connected or connecting
    if (!newSocket.connected && !newSocket.active) {
      newSocket.connect();
    }

    // Sync after the external socket setup completes so this effect does not
    // synchronously cascade into another render.
    queueMicrotask(() => {
      if (cancelled) return;
      setConnected(newSocket.connected);
      setActive(newSocket.active);
      setSocket(newSocket);
      setReady(true);
    });

    return () => {
      cancelled = true;
      newSocket.off("connect", onConnected);
      newSocket.off("connect_error", onConnectError);
      newSocket.off("disconnect", onDisconnect);
      newSocket.io.off("reconnect_attempt", onReconnectAttempt);
      newSocket.io.off("reconnect_failed", onReconnectFailed);
      // DON'T disconnect the socket on unmount - it's a singleton that persists
      // across page navigations so we don't lose events during navigation
      // newSocket.disconnect();
      setSocket(null);
      setActive(false);
      setReady(false);
    };
  }, [isLoaded, isSignedIn, getToken]);

  const connect = useCallback(() => {
    if (!socket) return;
    socket.connect();
    setActive(true);
  }, [socket]);

  return { socket, connected, active, ready, error, connect };
}
