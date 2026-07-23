// This file will contain the Redis Keys

export const ROOM_CODE_KEY = (roomCode: string) => `room-code:${roomCode}`;
export const WAITING_ROOM_KEY = (gameId: string) => `waiting-room:${gameId}`;
