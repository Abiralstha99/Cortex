import { useCallback } from "react";
import { useClerk, useAuth } from "@clerk/react";
import { clerkFluentDarkAppearance } from "@/clerk/appearance";

// Hook that returns an ensureSignedIn function which opens Clerk modal if needed.
// Returns one of: "already-signed-in" | "modal-opened" | "fallback-required"
export default function useAuthCommit() {
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();

  const ensureSignedIn = useCallback(
    async (): Promise<"already-signed-in" | "modal-opened" | "fallback-required"> => {
      // already signed in
      if (isLoaded && isSignedIn) return "already-signed-in";

      // If openSignIn is not available, signal caller to fallback to /login
      if (typeof openSignIn !== "function") return "fallback-required";

      // Open Clerk modal and let caller decide what to do next
      openSignIn({ appearance: clerkFluentDarkAppearance });
      return "modal-opened";
    },
    [openSignIn, isLoaded, isSignedIn],
  );

  return { ensureSignedIn };
}

