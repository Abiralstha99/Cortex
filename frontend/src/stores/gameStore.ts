import { create } from "zustand";
import type {
  NewQuestionPayload,
  AnswerResult,
  AnswerSubmittedPayload,
  RoundFinishedPayload,
  GameFinishedPayload,
  LeaderboardEntry,
  GameSnapshot,
} from "../lib/api";

type GamePhase =
  | "idle"
  | "countdown"
  | "question"
  | "answered"
  | "round_results"
  | "game_finished";

type GameState = {
  // Phase
  phase: GamePhase;
  countdownMs: number; // 3000 on game_started

  // Question phase
  roundNumber: number;
  question: string | null;
  options: string[];
  startedAt: Date | null;
  timeLimit: number; // 30000ms
  questionId: string | null;

  // Answer tracking
  myAnswer: number | null; // index 0-3
  answerResult: AnswerResult | null;
  otherAnswers: AnswerSubmittedPayload[]; // who else submitted this round

  // Results
  leaderboard: LeaderboardEntry[];
  roundResults: RoundFinishedPayload | null;
  gameResults: GameFinishedPayload | null;

  // Actions
  applyCountdown: (countdownMs: number) => void;
  applyNewQuestion: (payload: NewQuestionPayload) => void;
  applyAnswerResult: (result: AnswerResult) => void;
  applyAnswerSubmitted: (payload: AnswerSubmittedPayload) => void;
  applyRoundFinished: (payload: RoundFinishedPayload) => void;
  applyGameFinished: (payload: GameFinishedPayload) => void;
  applySnapshot: (snapshot: GameSnapshot) => void;
  submitAnswer: (answerIndex: number) => void;
  reset: () => void;
};

const initialState = {
  phase: "idle" as GamePhase,
  countdownMs: 0,
  roundNumber: 0,
  question: null as string | null,
  options: [] as string[],
  startedAt: null as Date | null,
  timeLimit: 30000,
  questionId: null as string | null,
  myAnswer: null as number | null,
  answerResult: null as AnswerResult | null,
  otherAnswers: [] as AnswerSubmittedPayload[],
  leaderboard: [] as LeaderboardEntry[],
  roundResults: null as RoundFinishedPayload | null,
  gameResults: null as GameFinishedPayload | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  applyCountdown: (countdownMs) =>
    set({
      phase: "countdown",
      countdownMs,
      myAnswer: null,
      answerResult: null,
    }),

  applyNewQuestion: (payload) =>
    set({
      phase: "question",
      roundNumber: payload.roundNumber,
      question: payload.question,
      options: payload.options,
      startedAt: new Date(payload.startedAt),
      questionId: payload.questionId,
      myAnswer: null,
      answerResult: null,
      otherAnswers: [],
    }),

  applyAnswerResult: (result) =>
    set({
      phase: "answered",
      answerResult: result,
    }),

  applyAnswerSubmitted: (payload) =>
    set((state) => ({
      otherAnswers: [...state.otherAnswers, payload],
    })),

  applyRoundFinished: (payload) =>
    set({
      phase: "round_results",
      roundResults: payload,
      leaderboard: payload.leaderboard,
    }),

  applyGameFinished: (payload) =>
    set({
      phase: "game_finished",
      gameResults: payload,
      leaderboard: payload.finalLeaderboard,
    }),

  applySnapshot: (snapshot) => {
    const payload = snapshot.payload;
    if (snapshot.phase === "countdown") {
      set({ ...initialState, phase: "countdown", countdownMs: Math.max(0,
        Number(payload.countdownEndsAt) - Date.now()) });
    } else if (snapshot.phase === "question") {
      const question = payload as NewQuestionPayload;
      set({ ...initialState, phase: snapshot.answerResult ? "answered" : "question",
        roundNumber: question.roundNumber, question: question.question,
        options: question.options, startedAt: new Date(question.startedAt),
        questionId: question.questionId, myAnswer: snapshot.myAnswer,
        answerResult: snapshot.answerResult });
    } else if (snapshot.phase === "round_results") {
      const results = payload as RoundFinishedPayload;
      set({ ...initialState, phase: "round_results", roundNumber: results.roundNumber,
        roundResults: results, leaderboard: results.leaderboard });
    } else {
      const results = payload as GameFinishedPayload;
      set({ ...initialState, phase: "game_finished", roundNumber: snapshot.numberOfRounds,
        gameResults: results, leaderboard: results.finalLeaderboard });
    }
  },

  submitAnswer: (answerIndex) =>
    set({
      myAnswer: answerIndex,
    }),

  reset: () => set(initialState),
}));
