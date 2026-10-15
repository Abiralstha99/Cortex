import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameSocket } from "./useGameSocket";
import { useGameStore } from "../stores/gameStore";
import { useLobbyStore } from "../stores/lobbyStore";
import type { ResumeGameResponse } from "../lib/api";

const connection = vi.hoisted(() => ({
  socket: null as unknown,
  connected: true,
  active: true,
  ready: true,
  connect: vi.fn(),
}));
vi.mock("./useSocket", () => ({ useSocket: () => connection }));

const gameId = "33333333-3333-3333-3333-333333333333";
const question = {
  roundNumber: 1, questionId: "q1", question: "What is Cortex?",
  options: ["A", "B", "C", "D"], startedAt: new Date().toISOString(),
};
const snapshot = (phaseVersion = 2): ResumeGameResponse => ({
  ok: true,
  snapshot: { gameId, numberOfRounds: 4, phaseVersion,
    phase: "question", payload: question, myAnswer: null, answerResult: null },
});

function fakeSocket() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  let acknowledge: ((error: Error | null, response?: ResumeGameResponse) => void) | undefined;
  const socket = {
    connected: true,
    resumeRequests: 0,
    on(event: string, callback: (payload: unknown) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);
      return socket;
    },
    off(event: string, callback: (payload: unknown) => void) {
      listeners.get(event)?.delete(callback);
      return socket;
    },
    timeout() {
      return { emit(event: string, _payload: unknown,
        callback: (error: Error | null, response?: ResumeGameResponse) => void) {
        if (event === "resume_game") {
          socket.resumeRequests += 1;
          acknowledge = callback;
        }
      } };
    },
    emit: vi.fn(),
    deliver(event: string, payload: unknown) {
      for (const callback of listeners.get(event) ?? []) callback(payload);
    },
    acknowledge(response: ResumeGameResponse) {
      acknowledge?.(null, response);
    },
  };
  return socket;
}

describe("game socket recovery", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useLobbyStore.getState().reset();
    connection.connected = true;
    connection.active = true;
    connection.socket = fakeSocket();
  });
  afterEach(cleanup);

  it("hydrates empty stores from the game URL snapshot", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    const { result } = renderHook(() => useGameSocket(gameId));
    act(() => socket.acknowledge(snapshot()));
    expect(result.current.recoveryState).toBe("ready");
    expect(useLobbyStore.getState().numberOfRounds).toBe(4);
    expect(useGameStore.getState().question).toBe(question.question);
  });

  it("replays only newer phase events received during recovery", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    renderHook(() => useGameSocket(gameId));
    act(() => {
      socket.deliver("new_question", { ...question, question: "Stale", phaseVersion: 1 });
      socket.deliver("round_finished", { roundNumber: 1, correctAnswer: "A",
        submissions: [], leaderboard: [], isLastRound: false, nextRoundIn: 3000,
        phaseVersion: 3 });
      socket.acknowledge(snapshot(2));
    });
    expect(useGameStore.getState().phase).toBe("round_results");
    expect(useGameStore.getState().question).not.toBe("Stale");
  });

  it("requests a new snapshot after reconnecting and catches a missed broadcast", () => {
    const first = connection.socket as ReturnType<typeof fakeSocket>;
    const { rerender } = renderHook(() => useGameSocket(gameId));
    act(() => first.acknowledge(snapshot()));
    connection.connected = false;
    rerender();
    const second = fakeSocket();
    connection.socket = second;
    connection.connected = true;
    rerender();
    act(() => second.acknowledge({ ok: true, snapshot: {
      gameId, numberOfRounds: 4, phaseVersion: 3, phase: "round_results",
      payload: { roundNumber: 1, correctAnswer: "A", submissions: [],
        leaderboard: [], isLastRound: false, nextRoundIn: 3000 },
      myAnswer: null, answerResult: null } }));
    expect(useGameStore.getState().phase).toBe("round_results");
  });

  it("keeps temporary failures retryable and marks definitive failures", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    const { result } = renderHook(() => useGameSocket(gameId));
    act(() => socket.acknowledge({ ok: false, reason: "temporary" }));
    expect(result.current.recoveryState).toBe("connecting");
    act(() => result.current.retryConnection());
    act(() => socket.acknowledge({ ok: false, reason: "not_member" }));
    expect(result.current.recoveryState).toBe("unavailable");
  });

  it("retries a temporary startup gap without requiring the player to click", () => {
    vi.useFakeTimers();
    try {
      const socket = connection.socket as ReturnType<typeof fakeSocket>;
      const { result } = renderHook(() => useGameSocket(gameId));
      act(() => socket.acknowledge({ ok: false, reason: "temporary" }));
      expect(result.current.recoveryState).toBe("connecting");
      act(() => vi.advanceTimersByTime(1000));
      expect(socket.resumeRequests).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
