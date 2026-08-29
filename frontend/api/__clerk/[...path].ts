import { clerkFrontendApiProxy } from "@clerk/backend/proxy";

export const config = {
  runtime: "nodejs",
};

/**
 * Node.js serverless handler for Clerk FAPI proxying on Vercel.
 * Edge Middleware cannot import @clerk/backend, so this runs as a
 * serverless function behind a vercel.json rewrite from /__clerk/*.
 */
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api\/__clerk/, "/__clerk");

  return clerkFrontendApiProxy(new Request(url, request), {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
}
