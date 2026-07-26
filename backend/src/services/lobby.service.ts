/*
When another player has a room code and wants to join, this file handles the logic:
- Looks up the room code in Redis to find which game it belongs to
- Reads the game hash and checks: does it exist? Is it still "waiting"? Is there space (max 8)?
- If the player is already in the list (e.g. the host reconnecting), it skips the write and just returns the current state
- Otherwise it appends the new player to the list and saves it back

Lobby Redis mutations for waiting rooms:
- joinWaitingGame: look up room code, append player (or no-op if already in)
- setPlayerReady: toggle a player's ready flag while status is waiting
*/

import redis from "../lib/redis.js";
import { ROOM_CODE_KEY, GAME_KEY } from "../lib/redisKeys.js";
import type { Player, WaitingRoom } from "../models/waitingRoom.types.js";

const MAX_PLAYERS = 8;
const JOIN_PLAYERS_LUA = `
  -- KEYS[1] = game:<gameId>
  -- ARGV[1] = playerId
  -- ARGV[2] = username
  -- ARGV[3] = maxPlayers
  -- returns: { status, playersJson? }
  --   status: "ok" | "already" | "full" | "not_waiting" | "missing"

  local raw = redis.call("HGET", KEYS[1], "players")
  local status = redis.call("HGET", KEYS[1], "status")

  if (not raw) or (not status) then
    return { "missing" }
  end

  if status ~= "waiting" then
    return { "not_waiting" }
  end

  local players = cjson.decode(raw)
  local playerId = ARGV[1]
  local maxPlayers = tonumber(ARGV[3])

  for i = 1, #players do
    if players[i].id == playerId then
      return { "already", raw }
    end
  end

  if #players >= maxPlayers then
    return { "full" }
  end

  players[#players + 1] = {
    id = playerId,
    username = ARGV[2],
    ready = false,
  }

  local encoded = cjson.encode(players)
  redis.call("HSET", KEYS[1], "players", encoded)
  return { "ok", encoded }
`;

const SET_PLAYER_READY_LUA = `
  -- KEYS[1] = game:<gameId>
  -- ARGV[1] = playerId
  -- returns: { status, ready? }
  --   status: "ok" | "missing" | "not_waiting" | "not_in_room"
  --   ready: "true" | "false" (only when status is "ok")

  local raw = redis.call("HGET", KEYS[1], "players")
  local status = redis.call("HGET", KEYS[1], "status")

  if (not raw) or (not status) then
    return { "missing" }
  end

  if status ~= "waiting" then
    return { "not_waiting" }
  end

  local players = cjson.decode(raw)
  local playerId = ARGV[1]

  for i = 1, #players do
    if players[i].id == playerId then
      local newReady = not players[i].ready
      players[i].ready = newReady
      local encoded = cjson.encode(players)
      redis.call("HSET", KEYS[1], "players", encoded)
      return { "ok", tostring(newReady) }
    end
  end

  return { "not_in_room" }
`;

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

  const result = (await redis.eval(
    JOIN_PLAYERS_LUA,
    1, // number of KEYS
    GAME_KEY(gameId),
    playerId,
    playerUsername,
    String(MAX_PLAYERS),
  )) as [string, string?];

  const [status, playersJson] = result;

  switch (status) {
    case "missing":
      throw new Error("Room not found");
    case "not_waiting":
      throw new Error("Game has already started");
    case "full":
      throw new Error("Room is full");
    case "ok":
    case "already":
      break;
    default:
      throw new Error("Failed to join game");
  }

  // Lua script returns the new players list, but the game needs other fields too
  const raw = (await redis.hgetall(GAME_KEY(gameId))) as Record<string, string>;
  if (!raw?.status) {
    throw new Error("Room not found");
  }

  const players: Player[] = JSON.parse(playersJson ?? raw.players!);
  return { game: deserializeRoom(raw, players), isNewJoin: status === "ok" };
}

export async function setPlayerReady(
  roomCode: string,
  playerId: string,
): Promise<{ ready: boolean; gameId: string }> {
  const gameId = await redis.get(ROOM_CODE_KEY(roomCode));
  if (!gameId) {
    throw new Error("Room not found");
  }

  const result = (await redis.eval(
    SET_PLAYER_READY_LUA,
    1,
    GAME_KEY(gameId),
    playerId,
  )) as [string, string?];

  // result returns result = ["ok", "false"]; -- so we're destructuring the array
  const [status, readyStr] = result;

  switch (status) {
    case "missing":
      throw new Error("Room not found");
    case "not_waiting":
      throw new Error("Game has already started");
    case "not_in_room":
      throw new Error("You are not in this room");
    case "ok":
      return { ready: readyStr === "true", gameId };
    default:
      throw new Error("Failed to update ready status");
  }
}
