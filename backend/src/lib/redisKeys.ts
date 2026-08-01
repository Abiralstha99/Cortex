// Redis key catalogue
//
// ROOM_CODE_KEY  room-code:<roomCode>          string
//   value: gameId
//   ttl:   mirrors GAME_KEY (set on creation, deleted on empty/finish)
//
// GAME_KEY       game:<gameId>                 hash
//   Waiting-room fields (set on creation):
//     gameId          string   — UUID
//     roomCode        string   — 6-char code
//     hostId          string   — Postgres users.id of the host
//     difficulty      string   — "Easy" | "Medium" | "Hard"
//     numberOfRounds  string   — coerced number
//     players         string   — JSON: Player[]  { id, username, ready }
//     status          string   — "waiting" | "playing" | "finished" | "cancelled"
//     createdAt       string   — ISO date
//   Added when game starts (status → "playing"):
//     currentRound    string   — coerced number, starts at 0
//     usedCountryIds  string   — JSON: number[]  grows each round
//
// ROUND_KEY      game:<gameId>:round           hash
//   Set at the start of each round by startRound():
//     roundNumber  string   — coerced number
//     countryId    string   — coerced number
//     country      string   — country name shown to players
//     capital      string   — correct answer (server-only, not broadcast)
//     startedAt    string   — ISO date, used to enforce the round timer
//
// NEXT_COUNTRY_KEY  game:<gameId>:nextCountry  string
//   Temporary prefetch buffer — written by prefetchNextCountry() in the
//   background while players answer the current round.
//   value: JSON  { id: number, name: string, capital: string }
//   lifecycle: written after startRound(), consumed + deleted by the next startRound()

export const ROOM_CODE_KEY = (roomCode: string) => `room-code:${roomCode}`;
export const GAME_KEY = (gameId: string) => `game:${gameId}`;
export const ROUND_KEY = (gameId: string) => `game:${gameId}:round`;
export const NEXT_COUNTRY_KEY = (gameId: string) => `game:${gameId}:nextCountry`;
