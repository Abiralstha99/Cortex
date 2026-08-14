import { create } from "zustand";
import type {
  LobbyPlayer,
  QuizGenStatus,
  WaitingGame,
} from "../lib/api";

type LobbyStatus = "idle" | "joining" | "in_lobby" | "starting" | "started" | "error";

type JoinedSnapshot = {
  gameId: string;
  roomCode: string;
  hostId: string;
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
  numberOfRounds: number;
  players: LobbyPlayer[];
};

type QuizStatusSnapshot = {
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
  numberOfRounds?: number;
};

type LobbyState = {
  roomCode: string | null;
  gameId: string | null;
  hostId: string | null;
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
  numberOfRounds: number | null;
  players: LobbyPlayer[];
  status: LobbyStatus;
  toast: string | null;
  myUserId: string | null;
  applyJoined: (snapshot: JoinedSnapshot) => void;
  applyQuizStatus: (snapshot: QuizStatusSnapshot) => void;
  applyPlayerJoined: (player: LobbyPlayer) => void;
  applyPlayerReady: (payload: { id: string; ready: boolean }) => void;
  applyPlayerLeft: (payload: { id: string; game: WaitingGame }) => void;
  setMyUserId: (id: string | null) => void;
  setStatus: (status: LobbyStatus) => void;
  setToast: (message: string | null) => void;
  applyGameStarted: (payload: { gameId: string }) => void;
  attemptStart: () => boolean;
  reset: () => void;
};

const initialState = {
  roomCode: null as string | null,
  gameId: null as string | null,
  hostId: null as string | null,
  quizId: null as string | null,
  quizGenStatus: "none" as QuizGenStatus,
  quizGenError: null as string | null,
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
      quizId: snapshot.quizId,
      quizGenStatus: snapshot.quizGenStatus,
      quizGenError: snapshot.quizGenError,
      numberOfRounds: snapshot.numberOfRounds,
      players: snapshot.players,
      status: "in_lobby",
      toast: null,
    }),

  applyQuizStatus: (snapshot) =>
    set((state) => ({
      quizId: snapshot.quizId,
      quizGenStatus: snapshot.quizGenStatus,
      quizGenError: snapshot.quizGenError,
      numberOfRounds: snapshot.numberOfRounds ?? state.numberOfRounds,
    })),

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

  applyGameStarted: ({ gameId }) =>
    set({ gameId, status: "started", toast: null }),

  attemptStart: () => {
    const { players, quizGenStatus, quizId } = get();
    if (quizGenStatus === "failed") {
      set({ toast: "Quiz generation failed" });
      return false;
    }
    if (quizGenStatus !== "ready" || !quizId) {
      set({ toast: "Quiz is still generating" });
      return false;
    }
    if (players.some((p) => !p.ready)) {
      set({ toast: "All players yet to ready" });
      return false;
    }
    set({ toast: null, status: "starting" });
    return true;
  },

  reset: () => set(initialState),
}));
