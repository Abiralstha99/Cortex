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
import { cn } from "@/lib/utils";

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
      <header
        className={cn(
          "mb-5 flex min-h-16 items-center",
          phase === "question" ? "justify-between" : "justify-start",
        )}
      >
        {numberOfRounds != null && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-sm">
            <span className="font-display text-sm font-extrabold text-ink">Round</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-forest">
              {roundNumber ?? "-"} / {numberOfRounds}
            </span>
          </div>
        )}
        {phase === "question" && startedAt && (
          <Timer startedAt={startedAt} timeLimit={timeLimit} />
        )}
      </header>

      <div className="space-y-6">
        {phase === "idle" && (
          <div className="rounded-(--radius-panel) border border-border bg-surface px-6 py-12 text-center shadow-sm">
            <p className="font-display text-lg font-bold text-muted">Starting game...</p>
          </div>
        )}

        {phase === "countdown" && <Countdown countdownMs={countdownMs} />}

        {phase === "question" && question && startedAt && (
          <QuestionCard
            question={question}
            options={options}
            onSubmit={handleSubmitAnswer}
            disabled={myAnswer !== null}
            selectedIndex={myAnswer}
          />
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
          <div
            role="status"
            className="rounded-(--radius-panel) border-2 border-danger bg-danger-soft p-4 text-center text-danger shadow-sm"
          >
            <p className="font-semibold">Disconnected from server. Reconnecting...</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
