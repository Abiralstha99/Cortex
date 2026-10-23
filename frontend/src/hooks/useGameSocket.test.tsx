import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameSocket } from "./useGameSocket";
import { useGameStore } from "../stores/gameStore";
import { useLobbyStore } from "../stores/lobbyStore";
import type { ResumeGameResponse, SubmitAnswerResponse } from "../lib/api";

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
  type: "MCQ", options: ["A", "B", "C", "D"], startedAt: new Date().toISOString(),
};
const snapshot = (phaseVersion = 2): ResumeGameResponse => ({
  ok: true,
  snapshot: { gameId, numberOfRounds: 4, phaseVersion,
    phase: "question", payload: question, myAnswer: null, answerResult: null },
});

function fakeSocket() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  let acknowledge: ((error: Error | null, response?: unknown) => void) | undefined;
  let submitAcknowledge: ((error: Error | null, response?: unknown) => void) | undefined;
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
        callback: (error: Error | null, response?: unknown) => void) {
        if (event === "resume_game") {
          socket.resumeRequests += 1;
          acknowledge = callback;
        } else if (event === "submit_answer") {
          submitAcknowledge = callback;
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
    answer(response?: SubmitAnswerResponse, error: Error | null = null) {
      submitAcknowledge?.(error, response);
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

  it("keeps the question visible while pending and confirms private feedback", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    const { result } = renderHook(() => useGameSocket(gameId));
    act(() => socket.acknowledge(snapshot()));
    act(() => result.current.submitAnswer("q1", 0, 300));
    expect(useGameStore.getState().phase).toBe("question");
    expect(useGameStore.getState().myAnswer).toBe(0);
    expect(useGameStore.getState().answerResult).toBeNull();
    act(() => socket.answer({ ok: true, result: { questionId: "q1", roundNumber: 1, correctAnswer: 1, correct: false, pointsEarned: 0, placement: null } }));
    expect(useGameStore.getState().phase).toBe("question");
    expect(useGameStore.getState().answerResult?.correctAnswer).toBe(1);
  });

  it("reconciles a rejected answer before another attempt", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    const { result } = renderHook(() => useGameSocket(gameId));
    act(() => socket.acknowledge(snapshot()));
    act(() => result.current.submitAnswer("q1", 0, 300));
    act(() => socket.answer({ ok: false, reason: "Stale submission" }));
    expect(result.current.recoveryState).toBe("connecting");
    expect(useGameStore.getState().myAnswer).toBe(0);
    act(() => socket.acknowledge(snapshot(2)));
    expect(result.current.recoveryState).toBe("ready");
    expect(useGameStore.getState().myAnswer).toBeNull();
  });

  it("reconciles an acknowledgement timeout before another attempt", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    const { result } = renderHook(() => useGameSocket(gameId));
    act(() => socket.acknowledge(snapshot()));
    act(() => result.current.submitAnswer("q1", 0, 300));
    act(() => socket.answer(undefined, new Error("timeout")));
    expect(result.current.recoveryState).toBe("connecting");
    expect(useGameStore.getState().myAnswer).toBe(0);
    act(() => socket.acknowledge(snapshot()));
    expect(useGameStore.getState().myAnswer).toBeNull();
  });

  it("restores feedback from a completed private submission", () => {
    const socket = connection.socket as ReturnType<typeof fakeSocket>;
    renderHook(() => useGameSocket(gameId));
    const recovered = snapshot();
    if (!recovered.ok) throw new Error("Expected snapshot");
    recovered.snapshot.myAnswer = 2;
    recovered.snapshot.answerResult = { questionId: "q1", roundNumber: 1, correctAnswer: 2, correct: true, pointsEarned: 100, placement: 1 };
    act(() => socket.acknowledge(recovered));
    expect(useGameStore.getState().phase).toBe("question");
    expect(useGameStore.getState().answerResult?.pointsEarned).toBe(100);
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
