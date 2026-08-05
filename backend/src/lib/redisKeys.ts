// Redis key catalogue
//
// ROOM_CODE_KEY  room-code:<roomCode>          string
//   value: gameId
//   ttl:   mirrors GAME_KEY (set on creation, deleted on empty/finish)
export const ROOM_CODE_KEY = (roomCode: string) => `room-code:${roomCode}`;


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
export const GAME_KEY = (gameId: string) => `game:${gameId}`;

// ROUND_KEY      game:<gameId>:round           hash
//   Set at the start of each round by startRound():
//     roundNumber       string   — coerced number
//     countryId         string   — coerced number
//     country           string   — country name shown to players
//     capital           string   — correct answer (server-only, not broadcast)
//     correctIndex      string   — coerced number, index of the correct MCQ option
//                                  (used by Lua script to grade submissions)
//     startedAt         string   — ISO date, used to enforce the round timer
//     submissionCount   string   — atomically incremented (HINCRBY) inside the
//                                  Lua submission script; when == totalPlayers
//                                  the last-submission path triggers early round-end
export const ROUND_KEY = (gameId: string) => `game:${gameId}:round`;

// NEXT_COUNTRY_KEY  game:<gameId>:nextCountry  string
//   Temporary prefetch buffer — written by prefetchNextCountry() in the
//   background while players answer the current round.
//   value: JSON  { id: number, name: string, capital: string }
//   lifecycle: written after startRound(), consumed + deleted by the next startRound()
export const NEXT_COUNTRY_KEY = (gameId: string) => `game:${gameId}:nextCountry`;

// CORRECT_COUNT_KEY  game:<gameId>:round:<n>:correctCount   string (integer)
//   Atomically incremented (INCR) each time a player submits a correct answer.
//   The value returned by INCR IS the player's placement (1st, 2nd, 3rd, ...).
//   Used inside the Lua submission script — never read-then-write separately.
//   TTL: expires with the round (set alongside ROUND_KEY).
export const CORRECT_COUNT_KEY = (gameId: string, round: number) =>
  `game:${gameId}:round:${round}:correctCount`;

// SUBMISSION_KEY  game:<gameId>:round:<n>:submissions:<playerId>   string
//   Written atomically inside the Lua submission script.
//   value: JSON SubmissionRecord — see types/room.types.ts
//   Acts as the duplicate-submission guard: SET NX, rejected if already exists.
export const SUBMISSION_KEY = (gameId: string, round: number, playerId: string) =>
  `game:${gameId}:round:${round}:submissions:${playerId}`;

// ROUND_ENDED_KEY  game:<gameId>:round:<n>:ended   string
//   SET NX guard — whichever path (BullMQ job or last-submission handler) sets
//   this key first is the sole executor of round-end logic; the other bails out.
//   value: "1"
export const ROUND_ENDED_KEY = (gameId: string, round: number) =>
  `game:${gameId}:round:${round}:ended`;
