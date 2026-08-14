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
  players: LobbyPlayer[];
  status: string;
  hostId: string;
  roomCode: string;
  createdAt: string | Date;
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
  body: { quizId?: string; rounds: number },
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

export async function generateQuizForGame(
  token: string | null,
  gameId: string,
  file: File,
  count: number,
): Promise<{ status: "processing" }> {
  const form = new FormData();
  form.append("file", file);
  form.append("count", String(count));

  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_URL}/api/games/waiting/${gameId}/generate`,
    {
      method: "POST",
      headers,
      body: form,
    },
  );
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
  const res = await apiFetch(
    `/api/games/waiting/${gameId}/quiz/fail`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
  if (!res.ok) {
    throw new Error("Failed to update quiz generation status");
  }
}

// Game event payloads
export type NewQuestionPayload = {
  roundNumber: number;
  questionId: string;
  question: string;
  options: string[];
  startedAt: string; // ISO timestamp
};

export type AnswerResult = {
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
  correctAnswer: string;
};

export type AnswerSubmittedPayload = {
  playerId: string;
  username: string;
};

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  username: string;
  score: number;
};

export type SubmissionSummary = {
  playerId: string;
  correct: boolean;
  pointsEarned: number;
  placement: number | null;
};

export type RoundFinishedPayload = {
  roundNumber: number;
  correctAnswer: string;
  submissions: SubmissionSummary[];
  leaderboard: LeaderboardEntry[];
  isLastRound: boolean;
  nextRoundIn: number; // ms
};

export type GameFinishedPayload = {
  finalLeaderboard: LeaderboardEntry[];
  winner: {
    playerId: string;
    username: string;
    score: number;
  };
};

export type QuizSummary = {
  id: string;
  title: string;
  sourceType: string;
  questionCount: number;
  createdAt: string;
};

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
  status: "completed" | "processing" | "failed";
  questions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  metadata?: Record<string, unknown>;
  error?: string;
};

export async function generateQuiz(
  token: string | null,
  file: File,
  count: number,
): Promise<GenerateResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("count", String(count));

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/quiz/generate`, {
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
