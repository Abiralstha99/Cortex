import * as z from "zod";
import { ClerkUserIdSchema, UsernameSchema } from "./common.js";

export const UserIdParamsSchema = z.object({
  userId: ClerkUserIdSchema,
});

export const UpdateUserBodySchema = z.object({
  username: UsernameSchema,
});

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;
