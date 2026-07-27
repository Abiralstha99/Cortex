const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type LobbyPlayer = {
  id: string;
  username: string;
  ready: boolean;
};

export type WaitingGame = {
  gameId: string;
  difficulty: Difficulty;
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

export async function createWaitingGame(
  token: string | null,
  body: { difficulty: Difficulty; rounds: number },
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
