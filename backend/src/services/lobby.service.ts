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
import { ROOM_CODE_KEY, GAME_KEY, GAME_START_LOCK_KEY } from "../lib/redisKeys.js";
import type { Player, WaitingRoom } from "../types/room.types.js";
import { RoomCodeSchema } from "../schemas/common.js";
import { prisma } from "../lib/prisma.js";
import { assertCanStartWithQuiz } from "./gamePlay.helpers.js";
import { waitingQuizPublicState } from "./waitingQuiz.helpers.js";
import { getQuizQuestions, shuffleQuestionIds } from "./quizCache.service.js";
import { randomUUID } from "node:crypto";

const ACTIVATE_GAME_LUA = `
if redis.call('HGET', KEYS[1], 'status') ~= 'waiting' then return 0 end
redis.call('HSET', KEYS[1],
  'status', 'playing',
  'questionOrder', ARGV[1],
  'quizVersion', ARGV[2],
  'currentRound', '0',
  'currentQuestionIndex', '-1')
redis.call('EXPIRE', KEYS[1], 7200)
redis.call('EXPIRE', KEYS[2], 7200)
return 1
`;

const RELEASE_START_LOCK_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

export async function acquireGameStartLock(gameId: string): Promise<string | null> {
  const token = randomUUID();
  const acquired = await redis.set(GAME_START_LOCK_KEY(gameId), token, "EX", 120, "NX");
  return acquired === "OK" ? token : null;
}

export async function releaseGameStartLock(gameId: string, token: string): Promise<void> {
  await redis.eval(RELEASE_START_LOCK_LUA, 1, GAME_START_LOCK_KEY(gameId), token);
}

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
    score = 0,
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

const LEAVE_GAME_LUA = `
  -- KEYS[1] = game:<gameId>
  -- ARGV[1] = playerId
  -- returns: { status, leftPlayerId? }
  --   status: "ok" | "empty" | "missing" | "not_waiting" | "not_in_room"
  --   "ok" / "empty" also include leftPlayerId

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
  local hostId = redis.call("HGET", KEYS[1], "hostId")
  local foundIndex = nil

  for i = 1, #players do
    if players[i].id == playerId then
      foundIndex = i
      break
    end
  end

  if not foundIndex then
    return { "not_in_room" }
  end

  table.remove(players, foundIndex)

  if #players == 0 then
    local isPublic = redis.call("HGET", KEYS[1], "isPublic") or "0"
    redis.call("DEL", KEYS[1])
    return { "empty", playerId, isPublic }
  end

  -- Host left with others remaining — promote the first remaining player.
  if hostId == playerId then
    hostId = players[1].id
  end

  redis.call(
    "HSET",
    KEYS[1],
    "players", cjson.encode(players),
    "hostId", hostId
  )

  return { "ok", playerId }
`;

// Since redis returns string, we need to deserialize the room object
function deserializeRoom(
  raw: Record<string, string>,
  players: Player[],
): WaitingRoom {
  const publicQuiz = waitingQuizPublicState(raw);
  return {
    gameId: raw.gameId!,
    quizId: publicQuiz.quizId,
    quizGenStatus: publicQuiz.quizGenStatus,
    quizGenJobId: raw.quizGenJobId?.trim() ? raw.quizGenJobId : null,
    quizGenError: publicQuiz.quizGenError,
    isPublic: raw.isPublic === "1",
    numberOfRounds: Number(raw.numberOfRounds),
    maxPlayers: Number(raw.maxPlayers || MAX_PLAYERS),
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

  const existing = (await redis.hgetall(GAME_KEY(gameId))) as Record<
    string,
    string
  >;
  const maxPlayers = Number(existing.maxPlayers || MAX_PLAYERS);

  const result = (await redis.eval(
    JOIN_PLAYERS_LUA,
    1, // number of KEYS
    GAME_KEY(gameId),
    playerId,
    playerUsername,
    String(maxPlayers),
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

export async function leaveWaitingGame(
  roomCode: string,
  playerId: string,
): Promise<{
  game: WaitingRoom | null;
  leftPlayerId: string;
  gameId: string;
  wasPublic: boolean;
}> {
  const gameId = await redis.get(ROOM_CODE_KEY(roomCode));
  if (!gameId) {
    throw new Error("Room not found");
  }

  const result = (await redis.eval(
    LEAVE_GAME_LUA,
    1,
    GAME_KEY(gameId),
    playerId,
  )) as [string, string?, string?];

  const [status, leftPlayerId, isPublicFlag] = result;

  switch (status) {
    case "missing":
      throw new Error("Room not found");
    case "not_waiting":
      throw new Error("Game has already started");
    case "not_in_room":
      throw new Error("You are not in this room");
    case "empty":
      await redis.del(ROOM_CODE_KEY(roomCode));
      return {
        game: null,
        leftPlayerId: leftPlayerId ?? playerId,
        gameId,
        wasPublic: isPublicFlag === "1",
      };
    case "ok":
      break;
    default:
      throw new Error("Unable to leave the room");
  }

  // LUA (string) => JSON (object) => Player[] (array) => WaitingRoom (object)
  const raw = (await redis.hgetall(GAME_KEY(gameId))) as Record<string, string>;
  if (!raw?.status) {
    throw new Error("Room not found");
  }

  const players: Player[] = JSON.parse(raw.players!);
  const game = deserializeRoom(raw, players);
  return {
    game,
    leftPlayerId: leftPlayerId ?? playerId,
    gameId,
    wasPublic: game.isPublic,
  };
}

export async function startGame(
  roomCode: string,
): Promise<{ game: WaitingRoom }> {
  const validatedRoomCode = RoomCodeSchema.parse(roomCode);
  const gameId = await redis.get(ROOM_CODE_KEY(validatedRoomCode));
  if (!gameId) throw new Error("Room not found");

  const lockToken = await acquireGameStartLock(gameId);
  if (!lockToken) {
    throw new Error("Game start is already in progress");
  }

  let persisted = false;
  let activated = false;
  try {
    const raw = await redis.hgetall(GAME_KEY(gameId));
    if (!raw.players || raw.status !== "waiting") throw new Error("Game has already started");
    const game = deserializeRoom(raw, JSON.parse(raw.players) as Player[]);
    if (game.players.length < 2) throw new Error("There must be at least 2 players to start the game");
    if (!game.players.every((player) => player.ready)) throw new Error("All players must be ready to start the game");
    assertCanStartWithQuiz(game.quizId, game.quizGenStatus);

    const snapshot = await getQuizQuestions(game.quizId);
    if (snapshot.questions.length < game.numberOfRounds) {
      throw new Error("Quiz has fewer questions than this game requires");
    }
    const order = shuffleQuestionIds(snapshot.questions.map((question) => question.id));

    // The stable game UUID makes a retry safe if the database write succeeded
    // but Redis did not acknowledge the activation.
    await prisma.game.upsert({
      where: { id: game.gameId },
      create: {
        id: game.gameId,
        roomCode: game.roomCode,
        hostId: game.hostId,
        quizId: game.quizId,
        status: "playing",
        rounds: game.numberOfRounds,
      },
      update: {},
    });
    persisted = true;

    activated = Number(await redis.eval(
      ACTIVATE_GAME_LUA,
      2,
      GAME_KEY(gameId),
      ROOM_CODE_KEY(validatedRoomCode),
      JSON.stringify(order),
      snapshot.version,
    )) === 1;
    if (!activated) throw new Error("Game has already started");
    return { game };
  } catch (error) {
    if (persisted && !activated) {
      // If Redis cannot be reached, retain the stable game row for a retry.
      const status = await redis.hget(GAME_KEY(gameId), "status").catch(() => null);
      if (status === "waiting") {
        await prisma.game.deleteMany({ where: { id: gameId } });
      }
    }
    throw error;
  } finally {
    await releaseGameStartLock(gameId, lockToken).catch((error) => {
      console.error(`Failed to release game start lock for ${gameId}:`, error);
    });
  }
}
