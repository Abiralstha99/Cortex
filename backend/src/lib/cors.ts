import type { CorsOptions } from "cors";

const DEFAULT_ORIGIN = "http://localhost:5173";

/** Trim whitespace and strip trailing slashes so env values match browser Origin headers. */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

/** Parse CLIENT_ORIGIN (comma-separated) into a normalized allowlist. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [DEFAULT_ORIGIN];
  }

  return raw
    .split(",")
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);
}

export const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGIN);

if (
  !process.env.CLIENT_ORIGIN?.trim() &&
  process.env.NODE_ENV === "production"
) {
  console.warn(
    "[cors] CLIENT_ORIGIN is unset in production — falling back to localhost only. " +
      "Set CLIENT_ORIGIN=https://get-cortex.vercel.app on Railway.",
  );
}

export function isOriginAllowed(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) {
    return true;
  }

  // Permit Vercel preview deploys when a *.vercel.app origin is configured.
  const allowsVercel = allowedOrigins.some((o) => o.endsWith(".vercel.app"));
  return (
    allowsVercel && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)
  );
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Non-browser requests (curl, health checks) have no Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }
    if (isOriginAllowed(origin)) {
      // Echo the request origin so credentials work with Access-Control-Allow-Origin.
      callback(null, origin);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

export const socketCorsOptions: CorsOptions = {
  origin: corsOptions.origin,
  credentials: true,
  methods: ["GET", "POST"],
};
