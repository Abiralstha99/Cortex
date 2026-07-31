import { useEffect } from "react";
import type { Difficulty, LobbyPlayer, WaitingGame } from "../lib/api";
import { useCurrentUser } from "./useCurrentUser";
import { useSocket } from "./useSocket";
import { useLobbyStore } from "../stores/lobbyStore";

type JoinedPayload = {
  gameId: string;
  roomCode: string;
  hostId: string;
  difficulty: Difficulty;
  numberOfRounds: number;
  players: LobbyPlayer[];
};

export function useLobbySocket(roomCode: string) {
  const { socket, connected, error: socketError } = useSocket();
  const { id: myUserId } = useCurrentUser();
  const applyJoined = useLobbyStore((s) => s.applyJoined);
  const applyPlayerJoined = useLobbyStore((s) => s.applyPlayerJoined);
  const applyPlayerReady = useLobbyStore((s) => s.applyPlayerReady);
  const applyPlayerLeft = useLobbyStore((s) => s.applyPlayerLeft);
  const applyGameStarted = useLobbyStore((s) => s.applyGameStarted);
  const setMyUserId = useLobbyStore((s) => s.setMyUserId);
  const setStatus = useLobbyStore((s) => s.setStatus);
  const setToast = useLobbyStore((s) => s.setToast);
  const reset = useLobbyStore((s) => s.reset);

  useEffect(() => {
    setMyUserId(myUserId);
  }, [myUserId, setMyUserId]);

  useEffect(() => {
    if (!socket || !connected || !roomCode) return;

    setStatus("joining");

    const onJoined = (payload: JoinedPayload) => applyJoined(payload);
    const onPlayerJoined = (player: LobbyPlayer) => applyPlayerJoined(player);
    const onPlayerReady = (payload: { id: string; ready: boolean }) =>
      applyPlayerReady(payload);
    const onPlayerLeft = (payload: { id: string; game: WaitingGame }) => {
      applyPlayerLeft(payload);
    };
    const onGameStarted = (payload: { gameId: string }) => {
      applyGameStarted(payload);
    };
    const onError = (payload: { message: string }) => {
      setStatus("error");
      setToast(payload.message);
    };

    socket.on("joined", onJoined);
    socket.on("player_joined", onPlayerJoined);
    socket.on("player_ready", onPlayerReady);
    socket.on("player_left", onPlayerLeft);
    socket.on("game_started", onGameStarted);
    socket.on("error", onError);

    socket.emit("join_game", { roomCode });

    return () => {
      socket.off("joined", onJoined);
      socket.off("player_joined", onPlayerJoined);
      socket.off("player_ready", onPlayerReady);
      socket.off("player_left", onPlayerLeft);
      socket.off("game_started", onGameStarted);
      socket.off("error", onError);
    };
  }, [
    socket,
    connected,
    roomCode,
    applyJoined,
    applyPlayerJoined,
    applyPlayerReady,
    applyPlayerLeft,
    applyGameStarted,
    setStatus,
    setToast,
  ]);

  function toggleReady() {
    socket?.emit("player_ready", { roomCode });
  }

  function startGame() {
    socket?.emit("start_game", { roomCode });
  }

  function leave() {
    socket?.emit("leave_game", { roomCode });
    reset();
  }

  return { connected, error: socketError, toggleReady, startGame, leave };
}
