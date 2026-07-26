// This file will contain the Redis Keys

export const ROOM_CODE_KEY = (roomCode: string) => `room-code:${roomCode}`;
// Single key namespace for a game's live state — used for both the waiting
// room and the active game so lookups never need to guess which phase it's in.
export const GAME_KEY = (gameId: string) => `game:${gameId}`;
