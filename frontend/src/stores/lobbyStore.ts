import { create } from "zustand";
import type { Difficulty, LobbyPlayer, WaitingGame } from "../lib/api";

type LobbyStatus = "idle" | "joining" | "in_lobby" | "error";

type JoinedSnapshot = {
  gameId: string;
  roomCode: string;
  hostId: string;
  difficulty: Difficulty;
  numberOfRounds: number;
  players: LobbyPlayer[];
};

type LobbyState = {
  roomCode: string | null;
  gameId: string | null;
  hostId: string | null;
  difficulty: Difficulty | null;
  numberOfRounds: number | null;
  players: LobbyPlayer[];
  status: LobbyStatus;
  toast: string | null;
  myUserId: string | null;
  applyJoined: (snapshot: JoinedSnapshot) => void;
  applyPlayerJoined: (player: LobbyPlayer) => void;
  applyPlayerReady: (payload: { id: string; ready: boolean }) => void;
  applyPlayerLeft: (payload: { id: string; game: WaitingGame }) => void;
  setMyUserId: (id: string | null) => void;
  setStatus: (status: LobbyStatus) => void;
  setToast: (message: string | null) => void;
  attemptStart: () => void;
  reset: () => void;
};

const initialState = {
  roomCode: null as string | null,
  gameId: null as string | null,
  hostId: null as string | null,
  difficulty: null as Difficulty | null,
  numberOfRounds: null as number | null,
  players: [] as LobbyPlayer[],
  status: "idle" as LobbyStatus,
  toast: null as string | null,
  myUserId: null as string | null,
};

export const useLobbyStore = create<LobbyState>((set, get) => ({
  ...initialState,

  applyJoined: (snapshot) =>
    set({
      gameId: snapshot.gameId,
      roomCode: snapshot.roomCode,
      hostId: snapshot.hostId,
      difficulty: snapshot.difficulty,
      numberOfRounds: snapshot.numberOfRounds,
      players: snapshot.players,
      status: "in_lobby",
      toast: null,
    }),

  applyPlayerJoined: (player) =>
    set((state) => {
      if (state.players.some((p) => p.id === player.id)) {
        return state;
      }
      return { players: [...state.players, player] };
    }),

  applyPlayerReady: ({ id, ready }) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, ready } : p,
      ),
    })),

  applyPlayerLeft: ({ game }) =>
    set({
      hostId: game.hostId,
      players: game.players,
      gameId: game.gameId ?? get().gameId,
    }),

  setMyUserId: (id) => set({ myUserId: id }),

  setStatus: (status) => set({ status }),

  setToast: (message) => set({ toast: message }),

  attemptStart: () => {
    const { players } = get();
    if (players.some((p) => !p.ready)) {
      set({ toast: "All players yet to ready" });
      return;
    }
    set({ toast: "Starting soon…" });
  },

  reset: () => set(initialState),
}));
