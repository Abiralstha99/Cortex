// This hook is used to get the current user's information from the database

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type AppUser = {
  username: string | null;
};

export function useCurrentUser() {
  const { getToken } = useAuth();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isClerkLoaded || !user) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAppUser({ username: data.username ?? null });
        }
      } catch {
        // Fall back to Clerk-derived name below.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, user, getToken]);

  const username = appUser?.username || user?.username || user?.firstName || "PLAYER";

  return { username, isLoading: isLoading && isClerkLoaded };
}
