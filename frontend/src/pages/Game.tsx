import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import Countdown from "../components/game/Countdown";
import QuestionCard from "../components/game/QuestionCard";
import Timer from "../components/game/Timer";
import AnswerFeedback from "../components/game/AnswerFeedback";
import RoundResults from "../components/game/RoundResults";
import GameResults from "../components/game/GameResults";
import { useLobbyStore } from "../stores/lobbyStore";
import { useGameStore } from "../stores/gameStore";
import { useGameSocket } from "../hooks/useGameSocket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "./Game.css";

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { id: myPlayerId } = useCurrentUser();

  const storeGameId = useLobbyStore((s) => s.gameId);
  const quizId = useLobbyStore((s) => s.quizId);
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
      // No gameId in URL - direct navigation to /game
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!storeGameId) {
      // No lobby state - user refreshed or navigated directly
      navigate("/dashboard", { replace: true });
      return;
    }

    if (storeGameId !== gameId) {
      // GameId mismatch - invalid navigation
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
    <div className="game">
      <AppHeader />

      <main className="game__main">
        <div className="game__header">
          <p className="eyebrow game__eyebrow">IN PROGRESS</p>
          <h1 className="game__heading">CAPITAL RUSH</h1>
          <div className="game__meta">
            <span className="game__tag">
              {quizId ? `QUIZ ${quizId.slice(0, 8)}` : "QUIZ"}
            </span>
            <span className="game__tag">{numberOfRounds} ROUNDS</span>
            {phase === "question" && (
              <span className="game__tag">ROUND {roundNumber}</span>
            )}
          </div>
        </div>

        <div className="game__content">
          {phase === "idle" && (
            <div className="game__loading">
              <p>Starting game...</p>
            </div>
          )}

          {phase === "countdown" && <Countdown countdownMs={countdownMs} />}

          {phase === "question" && question && startedAt && (
            <div className="game__question-phase">
              <Timer startedAt={startedAt} timeLimit={timeLimit} />
              <QuestionCard
                question={`What is the capital of ${question}?`}
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
            <div className="game__disconnected">
              <p>Disconnected from server. Reconnecting...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
