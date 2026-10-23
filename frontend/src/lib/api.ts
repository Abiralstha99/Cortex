const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// TODO(Phase 4): remove Difficulty once create-room UI selects a saved quiz.
export type Difficulty = "Easy" | "Medium" | "Hard";

export type LobbyPlayer = {
  id: string;
  username: string;
  ready: boolean;
};

export type QuizGenStatus = "none" | "processing" | "ready" | "failed";

export type WaitingGame = {
  gameId: string;
  quizId: string | null;
  quizGenStatus: QuizGenStatus;
  quizGenError: string | null;
  numberOfRounds: number;
  maxPlayers: number;
  players: LobbyPlayer[];
  status: string;
  hostId: string;
  roomCode: string;
  createdAt: string | Date;
};

export type PublicWaitingRoomSummary = {
  gameId: string;
  roomCode: string;
  hostId: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  numberOfRounds: number;
  quizGenStatus: QuizGenStatus;
  createdAt: string;
};

export async function apiFetch(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

// TODO(Phase 4): body should come from a quiz picker, not a dev env fallback.
export async function createWaitingGame(
  token: string | null,
  body: {
    quizId?: string;
    rounds: number;
    maxPlayers: number;
    isPublic?: boolean;
  },
): Promise<WaitingGame> {
  const res = await apiFetch("/api/games/waiting/", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(data?.message ?? "Failed to create game");
  }
  return res.json() as Promise<WaitingGame>;
}

export async function listPublicWaitingGames(
  token: string | null,
): Promise<PublicWaitingRoomSummary[]> {
  const res = await apiFetch("/api/games/waiting/public", token);
  if (!res.ok) {
    throw new Error("Failed to load public rooms");
  }
  return res.json() as Promise<PublicWaitingRoomSummary[]>;
}

export async function generateQuizForGame(
  token: string | null,
  gameId: string,
  file: File,
  count: number,
  title?: string,
): Promise<{ status: "processing" }> {
  const form = new FormData();
  form.append("file", file);
  form.append("count", String(count));
  if (title?.trim()) {
    form.append("title", title.trim());
  }

  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/games/waiting/${gameId}/generate`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    throw new Error(
      data?.error ?? data?.message ?? "Failed to start generation",
    );
  }
  return res.json() as Promise<{ status: "processing" }>;
}

export async function markWaitingQuizFailed(
  token: string | null,
  gameId: string,
  message: string,
): Promise<void> {
  const res = await apiFetch(`/api/games/waiting/${gameId}/quiz/fail`, token, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    throw new Error("Failed to update quiz generation status");
  }
}

// Game event payloads
export type AnswerValue = number | boolean | string;
export type NewQuestionPayload = {
  roundNumber: number;
  questionId: string;
  question: string;
  startedAt: string;
  phaseVersion?: number;
} & (
  | { type: "MCQ"; options: string[] }
  | { type: "TRUE_FALSE" }
  | { type: "FILL_BLANK" }
);

export type AnswerResult = {
  questionId: string;
  roundNumber: number;
  correctAnswer: AnswerValue;
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
  phaseVersion?: number;
};

export type AnswerSubmittedPayload = {
  playerId: string;
  username: string;
  phaseVersion?: number;
};

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
};

export type SubmissionSummary = {
  playerId: string;
  submitted: boolean;
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
};

export type RoundFinishedPayload = {
  roundNumber: number;
  submissions: SubmissionSummary[];
  leaderboard: LeaderboardEntry[];
  previousLeaderboard?: LeaderboardEntry[];
  revealEndsAt?: number;
  isLastRound: boolean;
  nextRoundIn: number; // ms
  phaseVersion?: number;
};

export type SubmitAnswerResponse =
  | { ok: true; result: AnswerResult }
  | { ok: false; reason: string };

export type GameReviewRound = {
  roundNumber: number;
  question: string;
  type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK";
  options?: string[];
  playerAnswer: AnswerValue | null;
  correct: boolean | null;
  pointsEarned: number;
  correctAnswer: string;
  explanation: string;
  sources: Array<{ chunkId: string; quote: string }>;
};

export type GameReview = { gameId: string; rounds: GameReviewRound[] };

export async function getGameReview(token: string | null, gameId: string): Promise<GameReview> {
  const response = await apiFetch(`/api/games/${gameId}/review`, token);
  if (!response.ok) {
    throw new Error(response.status === 404
      ? "Review isn't available for this game."
      : "We couldn't load the review. Try again.");
  }
  return response.json() as Promise<GameReview>;
}

export type GameFinishedPayload = {
  finalLeaderboard: LeaderboardEntry[];
  winners: LeaderboardEntry[];
  phaseVersion?: number;
};

export type GameSnapshot = {
  gameId: string;
  numberOfRounds: number;
  phaseVersion: number;
  phase: "countdown" | "question" | "round_results" | "game_finished";
  payload: Record<string, unknown>;
  myAnswer: AnswerValue | null;
  answerResult: AnswerResult | null;
};

export type ResumeGameResponse =
  | { ok: true; snapshot: GameSnapshot }
  | { ok: false; reason: "invalid_game" | "unavailable" | "not_member" | "temporary" };

export type QuizSummary = {
  id: string;
  title: string;
  sourceType: string;
  questionCount: number;
  createdAt: string;
  classification?: "MULTIPLAYER" | "SOLO_ONLY";
};

export type QuizDetails = QuizSummary & {
  status: string;
  questions?: Array<{ id: string; position: number; type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK"; question: string; options?: string[] }>;
};

export async function getQuiz(token: string | null, quizId: string): Promise<QuizDetails> {
  const response = await apiFetch(`/api/quizzes/${quizId}`, token);
  if (!response.ok) throw new Error(response.status === 404 ? "Quiz not found" : "Could not load quiz");
  return response.json() as Promise<QuizDetails>;
}

export async function deleteQuiz(token: string | null, quizId: string): Promise<void> {
  const response = await apiFetch(`/api/quizzes/${quizId}`, token, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not delete quiz");
  }
}

export async function listQuizzes(
  token: string | null,
): Promise<QuizSummary[]> {
  const res = await apiFetch("/api/quizzes", token);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;
    throw new Error(data?.error ?? data?.message ?? "Failed to load quizzes");
  }
  const body = (await res.json()) as { quizzes: QuizSummary[] };
  return body.quizzes;
}

export type GenerateResult = {
  quizId?: string;
  jobId?: string;
  status: "ready" | "completed" | "processing" | "failed";
  metadata?: Record<string, unknown>;
  error?: string;
  errorMessage?: string;
};

export async function generateQuiz(
  token: string | null,
  file: File,
  count: number,
  title?: string,
  soloOnly = false,
): Promise<GenerateResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("count", String(count));
  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/quiz/generate${soloOnly ? "/solo" : ""}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "Failed to generate quiz");
  }
  return res.json() as Promise<GenerateResult>;
}

export async function getQuizJob(
  token: string | null,
  jobId: string,
): Promise<GenerateResult> {
  const res = await apiFetch(`/api/quiz/jobs/${jobId}`, token);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "Failed to check job status");
  }
  return res.json() as Promise<GenerateResult>;
}

export type PracticeAnswer = { selectedIndex: number } | { answer: boolean } | { answer: string };
export type PracticeQuestion = { id: string; question: string; type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK"; options?: string[]; correctAnswer?: string; explanation?: string };
export type PracticeSession = {
  id: string; quizId: string; title: string; status: "IN_PROGRESS" | "COMPLETED";
  questions: PracticeQuestion[]; answers: Array<{ questionId: string; answer: PracticeAnswer; isCorrect?: boolean }>;
  resumeIndex: number; score?: number; completedAt?: string;
};
export type PracticeQuiz = { id: string; title: string; questionCount: number; classification?: "MULTIPLAYER" | "SOLO_ONLY"; unfinished: { id: string; answeredCount: number } | null; latestResult: { id: string; score: number; completedAt: string } | null };

async function practiceRequest<T>(token: string | null, path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`/api/practice${path}`, token, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Practice request failed. Try again.");
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const getPracticeLibrary = (token: string | null) => practiceRequest<{ created: PracticeQuiz[]; played: PracticeQuiz[] }>(token, "/library");
export const deleteSoloQuiz = (token: string | null, quizId: string) => practiceRequest<void>(token, `/quizzes/${quizId}`, { method: "DELETE" });
export const startPractice = (token: string | null, quizId: string, fresh = false) => practiceRequest<PracticeSession>(token, `/quizzes/${quizId}/${fresh ? "start-fresh" : "sessions"}`, { method: "POST" });
export const getPracticeSession = (token: string | null, sessionId: string) => practiceRequest<PracticeSession>(token, `/sessions/${sessionId}`);
export const getLatestPracticeResult = (token: string | null, quizId: string) => practiceRequest<PracticeSession>(token, `/quizzes/${quizId}/results/latest`);
export const savePracticeAnswer = (token: string | null, sessionId: string, questionId: string, answer: PracticeAnswer) => practiceRequest<{ questionId: string; answer: PracticeAnswer }>(token, `/sessions/${sessionId}/answers/${questionId}`, { method: "PUT", body: JSON.stringify(answer) });
export const clearPracticeAnswer = (token: string | null, sessionId: string, questionId: string) => practiceRequest<void>(token, `/sessions/${sessionId}/answers/${questionId}`, { method: "DELETE" });
export const submitPractice = (token: string | null, sessionId: string, pending?: { questionId: string; answer: PracticeAnswer }) => practiceRequest<PracticeSession>(token, `/sessions/${sessionId}/submit`, { method: "POST", body: JSON.stringify(pending ? { pending } : {}) });
