import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "../stores/gameStore";
import { useLobbyStore } from "../stores/lobbyStore";
import type {
  NewQuestionPayload, AnswerResult, AnswerSubmittedPayload,
  RoundFinishedPayload, GameFinishedPayload, ResumeGameResponse,
} from "../lib/api";

export type ConnectionState = "connected" | "reconnecting" | "offline";
export type RecoveryState = "connecting" | "ready" | "unavailable";

export function useGameSocket(gameId: string) {
  const { socket, connected, active, ready, connect } = useSocket();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("connecting");
  const [recoveryReason, setRecoveryReason] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const phaseVersion = useRef(0);

  const connectionState: ConnectionState = connected
    ? "connected" : socket && !active ? "offline" : "reconnecting";

  useEffect(() => {
    if (!socket || !connected || !gameId) return;
    let cancelled = false;
    let recovering = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const buffered: { version: number; phase: boolean; apply: () => void }[] = [];
    queueMicrotask(() => { if (!cancelled) setRecoveryState("connecting"); });

    const receive = (version: number | undefined, phase: boolean, apply: () => void) => {
      const event = { version: version ?? 0, phase, apply };
      if (recovering) { buffered.push(event); return; }
      if (phase ? event.version > phaseVersion.current : event.version >= phaseVersion.current) {
        apply();
        if (phase) phaseVersion.current = event.version;
      }
    };
    const onGameStarted = (payload: { gameId: string; countdownMs: number; countdownEndsAt?: number; phaseVersion?: number }) => {
      if (payload.gameId === gameId) receive(payload.phaseVersion, true, () =>
        useGameStore.getState().applyCountdown(Math.max(0,
          (payload.countdownEndsAt ?? Date.now() + payload.countdownMs) - Date.now())));
    };
    const onNewQuestion = (payload: NewQuestionPayload) => receive(payload.phaseVersion, true,
      () => useGameStore.getState().applyNewQuestion(payload));
    const onAnswerResult = (payload: AnswerResult) => receive(payload.phaseVersion, false,
      () => useGameStore.getState().applyAnswerResult(payload));
    const onAnswerSubmitted = (payload: AnswerSubmittedPayload) => receive(payload.phaseVersion, false,
      () => useGameStore.getState().applyAnswerSubmitted(payload));
    const onRoundFinished = (payload: RoundFinishedPayload) => receive(payload.phaseVersion, true,
      () => useGameStore.getState().applyRoundFinished(payload));
    const onGameFinished = (payload: GameFinishedPayload) => receive(payload.phaseVersion, true,
      () => useGameStore.getState().applyGameFinished(payload));

    socket.on("game_started", onGameStarted);
    socket.on("new_question", onNewQuestion);
    socket.on("answer_result", onAnswerResult);
    socket.on("answer_submitted", onAnswerSubmitted);
    socket.on("round_finished", onRoundFinished);
    socket.on("game_finished", onGameFinished);

    socket.timeout(5000).emit("resume_game", { gameId },
      (error: Error | null, response?: ResumeGameResponse) => {
        if (cancelled) return;
        if (error || !response || (!response.ok && response.reason === "temporary")) {
          setRecoveryState("connecting");
          setRecoveryReason(null);
          retryTimer = setTimeout(() => { if (!cancelled) setRetryKey((key) => key + 1); }, 1000);
          return;
        }
        if (!response.ok) {
          setRecoveryReason(response.reason);
          setRecoveryState("unavailable");
          return;
        }
        useLobbyStore.setState({ gameId: response.snapshot.gameId,
          numberOfRounds: response.snapshot.numberOfRounds });
        useGameStore.getState().applySnapshot(response.snapshot);
        phaseVersion.current = response.snapshot.phaseVersion;
        recovering = false;
        for (const event of buffered) {
          if (event.phase ? event.version > phaseVersion.current : event.version >= phaseVersion.current) {
            event.apply();
            if (event.phase) phaseVersion.current = event.version;
          }
        }
        setRecoveryReason(null);
        setRecoveryState("ready");
      });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket.off("game_started", onGameStarted);
      socket.off("new_question", onNewQuestion);
      socket.off("answer_result", onAnswerResult);
      socket.off("answer_submitted", onAnswerSubmitted);
      socket.off("round_finished", onRoundFinished);
      socket.off("game_finished", onGameFinished);
    };
  }, [socket, connected, gameId, retryKey]);

  function submitAnswer(questionId: string, answerIndex: number, responseTime: number) {
    if (!socket || !connected || recoveryState !== "ready") return;
    socket.emit("submit_answer", { gameId, questionId, answerIndex, responseTime });
    useGameStore.getState().submitAnswer(answerIndex);
  }

  function retryConnection() {
    if (socket?.connected) setRetryKey((key) => key + 1);
    else connect();
  }

  return { connected, connectionReady: ready, connectionState,
    recoveryState, recoveryReason, submitAnswer, retryConnection };
}
