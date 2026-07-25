import type { Socket } from "socket.io";
import type { ZodType } from "zod";

/**
 * Validates a Socket.io event payload. On failure, emits `error` and returns null.
 */
export function parseSocketPayload<T>(
  socket: Socket,
  schema: ZodType<T>,
  payload: unknown,
): T | null {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Invalid payload";
    socket.emit("error", { message });
    return null;
  }
  return result.data;
}
