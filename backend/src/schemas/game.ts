import * as z from "zod";
import { RoomCodeSchema } from "./common.js";

export const MIN_ROUNDS = 3;
export const MAX_ROUNDS = 20;
export const DEFAULT_ROUNDS = 10;

export const CreateWaitingGameSchema = z.object({
  quizId: z.string().uuid().optional(),
  rounds: z
    .number()
    .int()
    .min(MIN_ROUNDS)
    .max(MAX_ROUNDS)
    .default(DEFAULT_ROUNDS),
});

export const WaitingGameIdParamsSchema = z.object({
  gameId: z.string().uuid(),
});

export const FailWaitingQuizSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .default("Failed to start quiz generation"),
});

export const JoinGamePayloadSchema = z.object({
  roomCode: RoomCodeSchema,
});

export const SubmitAnswerPayloadSchema = z.object({
  gameId: z.string().uuid(),
  questionId: z.string().uuid(),
  answerIndex: z.number().int().min(0).max(3),
  responseTime: z.number().int().nonnegative(),
});

export type CreateWaitingGameInput = z.infer<typeof CreateWaitingGameSchema>;
export type FailWaitingQuizInput = z.infer<typeof FailWaitingQuizSchema>;
export type WaitingGameIdParams = z.infer<typeof WaitingGameIdParamsSchema>;
export type JoinGamePayload = z.infer<typeof JoinGamePayloadSchema>;
export type SubmitAnswerPayload = z.infer<typeof SubmitAnswerPayloadSchema>;
