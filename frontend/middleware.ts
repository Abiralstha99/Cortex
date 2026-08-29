import { clerkFrontendApiProxy } from "@clerk/backend/proxy";

/**
 * Vercel Edge Middleware — equivalent to Next.js clerkMiddleware() with
 * frontendApiProxy enabled. Handles /__clerk/:path* before SPA rewrites run.
 *
 * Requires server-only env vars on Vercel (never VITE_*):
 *   CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
 */
export default function middleware(request: Request) {
  return clerkFrontendApiProxy(request, {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
}

export const config = {
  matcher: ["/__clerk", "/__clerk/:path*"],
};
