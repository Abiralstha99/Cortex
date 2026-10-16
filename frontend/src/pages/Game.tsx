import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Countdown from "@/components/game/Countdown";
import QuestionCard from "@/components/game/QuestionCard";
import Timer from "@/components/game/Timer";
import AnswerFeedback from "@/components/game/AnswerFeedback";
import RoundResults from "@/components/game/RoundResults";
import GameResults from "@/components/game/GameResults";
import ConnectionBanner from "@/components/game/ConnectionBanner";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useGameStore } from "@/stores/gameStore";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import "@/styles/editorialApp.css";

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { id: myPlayerId } = useCurrentUser();

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

  const {
    connectionReady,
    connectionState,
    recoveryState,
    recoveryReason,
    submitAnswer,
    retryConnection,
  } = useGameSocket(gameId ?? "");

  const responseStartTime = useRef<number | null>(null);
  const previousConnectionState = useRef<typeof connectionState | null>(null);
  const reconnectedDismissTimer = useRef<number | undefined>(undefined);
  const [showReconnected, setShowReconnected] = useState(false);

  // Track response time from when question appears
  useEffect(() => {
    if (phase === "question" && startedAt) {
      responseStartTime.current = Date.now();
    }
  }, [phase, startedAt]);

  useEffect(() => {
    const wasReconnecting =
      connectionReady && previousConnectionState.current === "reconnecting";
    const didReconnect = wasReconnecting && connectionState === "connected";

    const syncTransition = window.setTimeout(() => {
      if (!connectionReady) {
        previousConnectionState.current = null;
        setShowReconnected(false);
        return;
      }

      previousConnectionState.current = connectionState;
      if (didReconnect) {
        setShowReconnected(true);
        reconnectedDismissTimer.current = window.setTimeout(() => {
          setShowReconnected(false);
        }, 2_000);
      } else if (connectionState !== "connected") {
        setShowReconnected(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(syncTransition);
      if (reconnectedDismissTimer.current !== undefined) {
        window.clearTimeout(reconnectedDismissTimer.current);
        reconnectedDismissTimer.current = undefined;
      }
    };
  }, [connectionReady, connectionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  function handleSubmitAnswer(answerIndex: number) {
    if (!responseStartTime.current || !questionId) return;
    const responseTime = Date.now() - responseStartTime.current;

    submitAnswer(questionId, answerIndex, responseTime);
  }

  function handleExit() {
    navigate("/dashboard");
  }

  const isFinished = phase === "game_finished";
  const isOffline =
    connectionReady && connectionState === "offline" && !isFinished;
  const showConnectionStatus =
    connectionReady &&
    !isFinished &&
    (connectionState === "reconnecting" ||
      (connectionState === "connected" && showReconnected));

  return (
    <div data-theme="editorial-app" className="editorial-app editorial-game min-h-dvh bg-background text-ink">
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        {recoveryState === "unavailable" || !gameId ? (
          <section role="alert" className="m-auto rounded-[var(--radius-panel)] border border-border bg-surface p-8 text-center">
            <h1 className="font-display text-2xl font-bold">Game unavailable</h1>
            <p className="mt-2 text-muted-foreground">
              {recoveryReason === "not_member"
                ? "You're not a player in this game."
                : "This game is no longer available."}
            </p>
            <button className="mt-6 text-primary underline" type="button" onClick={handleExit}>Return home</button>
          </section>
        ) : isOffline ? (
          <div className="flex flex-1 items-center justify-center">
            <ConnectionBanner
              state="offline"
              onRetry={retryConnection}
            />
          </div>
        ) : recoveryState !== "ready" || !myPlayerId ? (
          <section role="status" className="m-auto text-center">
            <h1 className="font-display text-xl font-semibold">Connecting to game...</h1>
            {connectionReady && connectionState === "connected" && (
              <button className="mt-4 text-primary underline" type="button" onClick={retryConnection}>Try again</button>
            )}
          </section>
        ) : (
          <>
            {showConnectionStatus && (
              <div className="mb-4">
                <ConnectionBanner
                  state={
                    connectionState === "connected" && showReconnected
                      ? "connected"
                      : connectionState
                  }
                  onRetry={retryConnection}
                />
              </div>
            )}

            <header
              className={cn(
                "editorial-game-header mb-4 flex min-h-12 flex-col gap-2 sm:flex-row sm:items-center",
                phase === "question" ? "sm:justify-between" : "sm:justify-start",
              )}
            >
              <span className="editorial-game-wordmark" aria-label="Cortex">Cortex</span>
              {numberOfRounds != null && (
                <p className="font-display text-sm font-semibold text-muted-foreground">
                  Round{" "}
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {roundNumber || "-"} of {numberOfRounds}
                  </span>
                </p>
              )}
              {phase === "question" && numberOfRounds != null && (
                <div className="editorial-round-progress" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={numberOfRounds} aria-valuenow={roundNumber}>
                  <span style={{ width: `${Math.min(100, Math.max(0, roundNumber / numberOfRounds * 100))}%` }} />
                </div>
              )}
              {phase === "question" && startedAt && (
                <Timer startedAt={startedAt} timeLimit={timeLimit} />
              )}
            </header>

            <div className="space-y-6">
              {phase === "idle" && (
                <section className="rounded-[var(--radius-panel)] border border-border bg-surface px-6 py-12 text-center shadow-card">
                  <h1 className="font-display text-xl font-bold text-ink">
                    Starting game...
                  </h1>
                </section>
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}
