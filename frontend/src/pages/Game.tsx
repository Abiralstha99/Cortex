import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Countdown from "@/components/game/Countdown";
import QuestionCard from "@/components/game/QuestionCard";
import Timer from "@/components/game/Timer";
import AnswerFeedback from "@/components/game/AnswerFeedback";
import RoundResults from "@/components/game/RoundResults";
import GameResults from "@/components/game/GameResults";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useGameStore } from "@/stores/gameStore";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { id: myPlayerId } = useCurrentUser();

  const storeGameId = useLobbyStore((s) => s.gameId);
  const numberOfRounds = useLobbyStore((s) => s.numberOfRounds);

  const phase = useGameStore((s) => s.phase);
  const countdownMs = useGameStore((s) => s.countdownMs);
  const question = useGameStore((s) => s.question);
  const options = useGameStore((s) => s.options);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const startedAt = useGameStore((s) => s.startedAt);
  const timeLimit = useGameStore((s) => s.timeLimit);
  const questionId = useGameStore((s) => s.questionId);
  const myAnswer = useGameStore((s) => s.myAnswer);
  const answerResult = useGameStore((s) => s.answerResult);
  const roundResults = useGameStore((s) => s.roundResults);
  const gameResults = useGameStore((s) => s.gameResults);
  const reset = useGameStore((s) => s.reset);

  const { connected, submitAnswer } = useGameSocket(gameId ?? "");

  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

  // Guard: redirect if no gameId in URL or if gameId doesn't match lobby state
  useEffect(() => {
    if (!gameId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!storeGameId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (storeGameId !== gameId) {
      navigate("/dashboard", { replace: true });
    }
  }, [storeGameId, gameId, navigate]);

  // Track response time from when question appears
  useEffect(() => {
    if (phase === "question" && startedAt) {
      setResponseStartTime(Date.now());
    }
  }, [phase, startedAt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  function handleSubmitAnswer(answerIndex: number) {
    if (!responseStartTime || !questionId) return;
    const responseTime = Date.now() - responseStartTime;

    submitAnswer(questionId, answerIndex, responseTime);
  }

  if (!storeGameId || !myPlayerId) return null;

  return (
    <PageShell maxWidth="3xl">
      {/* Compact game meta */}
      <div className="mb-6 flex items-center gap-3 text-xs text-muted">
        {numberOfRounds != null && (
          <span className="font-mono">
            Round {roundNumber ?? "-"} / {numberOfRounds}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {phase === "idle" && (
          <div className="py-12 text-muted">
            <p>Starting game...</p>
          </div>
        )}

        {phase === "countdown" && <Countdown countdownMs={countdownMs} />}

        {phase === "question" && question && startedAt && (
          <div className="space-y-6">
            <Timer startedAt={startedAt} timeLimit={timeLimit} />
            <QuestionCard
              question={question}
              options={options}
              onSubmit={handleSubmitAnswer}
              disabled={myAnswer !== null}
              selectedIndex={myAnswer}
            />
          </div>
        )}

        {phase === "answered" && answerResult && (
          <AnswerFeedback result={answerResult} />
        )}

        {phase === "round_results" && roundResults && (
          <RoundResults roundResults={roundResults} myPlayerId={myPlayerId} />
        )}

        {phase === "game_finished" && gameResults && (
          <GameResults gameResults={gameResults} myPlayerId={myPlayerId} />
        )}

        {!connected && phase !== "game_finished" && (
          <div className="rounded-lg border border-danger bg-danger-soft p-4 text-center text-danger">
            <p>Disconnected from server. Reconnecting...</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
