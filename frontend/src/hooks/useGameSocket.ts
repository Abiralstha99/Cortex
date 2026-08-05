import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "../stores/gameStore";
import type {
  NewQuestionPayload,
  AnswerResult,
  AnswerSubmittedPayload,
  RoundFinishedPayload,
  GameFinishedPayload,
} from "../lib/api";

export function useGameSocket(gameId: string) {
  const { socket, connected } = useSocket();

  const applyCountdown = useGameStore((s) => s.applyCountdown);
  const applyNewQuestion = useGameStore((s) => s.applyNewQuestion);
  const applyAnswerResult = useGameStore((s) => s.applyAnswerResult);
  const applyAnswerSubmitted = useGameStore((s) => s.applyAnswerSubmitted);
  const applyRoundFinished = useGameStore((s) => s.applyRoundFinished);
  const applyGameFinished = useGameStore((s) => s.applyGameFinished);

  useEffect(() => {
    if (!socket || !connected || !gameId) return;

    const onGameStarted = (payload: { gameId: string; countdownMs: number }) => {
      if (payload.gameId === gameId) {
        applyCountdown(payload.countdownMs);
      }
    };

    const onNewQuestion = (payload: NewQuestionPayload) => {
      applyNewQuestion(payload);
    };

    const onAnswerResult = (result: AnswerResult) => {
      applyAnswerResult(result);
    };

    const onAnswerSubmitted = (payload: AnswerSubmittedPayload) => {
      applyAnswerSubmitted(payload);
    };

    const onRoundFinished = (payload: RoundFinishedPayload) => {
      applyRoundFinished(payload);
    };

    const onGameFinished = (payload: GameFinishedPayload) => {
      applyGameFinished(payload);
    };

    // Register listeners
    socket.on("game_started", onGameStarted);
    socket.on("new_question", onNewQuestion);
    socket.on("answer_result", onAnswerResult);
    socket.on("answer_submitted", onAnswerSubmitted);
    socket.on("round_finished", onRoundFinished);
    socket.on("game_finished", onGameFinished);

    return () => {
      socket.off("game_started", onGameStarted);
      socket.off("new_question", onNewQuestion);
      socket.off("answer_result", onAnswerResult);
      socket.off("answer_submitted", onAnswerSubmitted);
      socket.off("round_finished", onRoundFinished);
      socket.off("game_finished", onGameFinished);
    };
  }, [
    socket,
    connected,
    gameId,
    applyCountdown,
    applyNewQuestion,
    applyAnswerResult,
    applyAnswerSubmitted,
    applyRoundFinished,
    applyGameFinished,
  ]);

  function submitAnswer(countryId: number, answerIndex: number, responseTime: number) {
    if (!socket) return;
    socket.emit("submit_answer", { gameId, countryId, answerIndex, responseTime });
    useGameStore.getState().submitAnswer(answerIndex);
  }

  return { connected, submitAnswer };
}
