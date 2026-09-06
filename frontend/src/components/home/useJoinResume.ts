import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useHomeIntentStore } from "@/stores/homeIntentStore";

// Hook to auto-resume pending join or create intents when Clerk is loaded & signed in.
export default function useJoinResume() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    // take pending join code BEFORE navigate to avoid double-resume
    const code = useHomeIntentStore.getState().takePendingJoinCode();
    if (code) {
      navigate(`/game/lobby/${code}`);
      return;
    }

    // take create resume request if present
    const wantCreate = useHomeIntentStore.getState().takeCreateResume();
    if (wantCreate) {
      navigate("/game/create");
      return;
    }
    // nothing to resume
  }, [isLoaded, user, navigate, location]);
}

