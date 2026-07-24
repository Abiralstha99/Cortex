/*
When another player has a room code and wants to join, this file handles the logic:
- Looks up the room code in Redis to find which game it belongs to
- Reads the game hash and checks: does it exist? Is it still "waiting"? Is there space (max 8)?
- If the player is already in the list (e.g. the host reconnecting), it skips the write and just returns the current state
- Otherwise it appends the new player to the list and saves it back
*/

import redis from "../lib/redis.js";
import { ROOM_CODE_KEY, GAME_KEY } from "./redisKeys.js";
import type { Player, WaitingRoom } from "./types.js";

const MAX_PLAYERS = 8;

export async function joinWaitingGame({
  roomCode,
  playerId,
  playerUsername,
}: {
  roomCode: string;
  playerId: string;
  playerUsername: string;
}): Promise<{ game: WaitingRoom; isNewJoin: boolean }> {
  const gameId = await redis.get(ROOM_CODE_KEY(roomCode));
  if (!gameId) {
    throw new Error("Room not found");
  }

  const raw = (await redis.hgetall(GAME_KEY(gameId))) as Record<string, string>;
  if (!raw || !raw.status) {
    throw new Error("Room not found");
  }

  if (raw.status !== "waiting") {
    throw new Error("Game has already started");
  }

  const players: Player[] = JSON.parse(raw.players!);

  // Already in the room (host reconnect or duplicate join) — skip mutation
  const alreadyJoined = players.some((p) => p.id === playerId);
  if (alreadyJoined) {
    return { game: deserializeRoom(raw, players), isNewJoin: false };
  }

  if (players.length >= MAX_PLAYERS) {
    throw new Error("Room is full");
  }

  const newPlayer: Player = {
    id: playerId,
    username: playerUsername,
    ready: false,
  };
  players.push(newPlayer);

  // Only the players field is updated in Redis. 
  await redis.hset(GAME_KEY(gameId), "players", JSON.stringify(players));

  return { game: deserializeRoom(raw, players), isNewJoin: true };
}

// Since redis returns string, we need to deserialize the room object
function deserializeRoom(
  raw: Record<string, string>,
  players: Player[],
): WaitingRoom {
  return {
    gameId: raw.gameId!,
    difficulty: raw.difficulty as WaitingRoom["difficulty"],
    numberOfRounds: Number(raw.numberOfRounds),
    players,
    status: "waiting",
    hostId: raw.hostId!,
    roomCode: raw.roomCode!,
    createdAt: new Date(raw.createdAt!),
  };
}
