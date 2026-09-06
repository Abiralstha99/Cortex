import { useCallback } from "react";
import { useClerk, useUser } from "@clerk/react";
import { clerkFluentDarkAppearance } from "@/clerk/appearance";

// Hook that returns an ensureSignedIn function which opens Clerk modal if needed
export default function useAuthCommit() {
  const { openSignIn } = useClerk();
  const { user, isLoaded } = useUser();

  const ensureSignedIn = useCallback(async (): Promise<boolean> => {
    // already signed in
    if (isLoaded && user) return true;

    // If openSignIn is not available, signal caller to fallback to /login
    if (typeof openSignIn !== "function") return false;

    openSignIn({ appearance: clerkFluentDarkAppearance });

    // Poll for sign-in; resolve true when user appears, give up if caller navigates away
    return await new Promise<boolean>((resolve) => {
      let cancelled = false;

      // Poll for a Clerk-provided global snapshot (best-effort fallback)
      const iv = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalUser = (window as any).__clerkUserSnapshot;
        if (globalUser) {
          clearInterval(iv);
          cancelled = true;
          resolve(true);
        }
      }, 250);

      // Safety: resolve false after 2 minutes to avoid a permanently pending promise
      setTimeout(() => {
        if (!cancelled) {
          clearInterval(iv);
          resolve(false);
        }
      }, 2 * 60 * 1000);
    });
  }, [openSignIn, user, isLoaded]);

  return { ensureSignedIn };
}

