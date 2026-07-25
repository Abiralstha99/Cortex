import * as z from "zod";
import { RoomCodeSchema } from "./common.js";

export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 20;
export const DEFAULT_ROUNDS = 10;

export const DifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

export const CreateWaitingGameSchema = z.object({
  difficulty: DifficultySchema,
  rounds: z
    .number()
    .int()
    .min(MIN_ROUNDS)
    .max(MAX_ROUNDS)
    .default(DEFAULT_ROUNDS),
});

export const JoinGamePayloadSchema = z.object({
  roomCode: RoomCodeSchema,
});

export type Difficulty = z.infer<typeof DifficultySchema>;
export type CreateWaitingGameInput = z.infer<typeof CreateWaitingGameSchema>;
export type JoinGamePayload = z.infer<typeof JoinGamePayloadSchema>;
