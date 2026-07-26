// This file will contain the room code generation logic
// We will be reserving the roomcode in redis to avoid collisions

import crypto from "crypto";
import redis from "./redis.js";
import { ROOM_CODE_KEY } from "./redisKeys.js";

const MAX_ATTEMPTS = 10;
const MAX_RESERVATION_TIME = 60 * 60; // 1 hour
const ROOM_CODE_LENGTH = 6;

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }

  return code;
}

export async function reserveRoomCode(gameId: string) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const roomCode = generateRoomCode();
    const res = await redis.set(
      ROOM_CODE_KEY(roomCode),
      gameId,
      "EX",
      MAX_RESERVATION_TIME,
      "NX",
    );
    if (res === "OK") {
      return roomCode;
    }
  }
  throw new Error("Failed to reserve room code");
}
