import * as z from "zod";

/** Matches room codes produced by `reserveRoomCode` (6 A–Z / 0–9). */
export const RoomCodeSchema = z
  .string()
  .trim()
  .min(1, "Room code is required")
  .transform((code) => code.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{6}$/, "Room code must be 6 letters or digits"));

export const UsernameSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_]{3,20}$/,
    "username must be 3-20 characters and contain only letters, numbers, and underscores",
  );

export const ClerkUserIdSchema = z.string().min(1, "User id is required");
