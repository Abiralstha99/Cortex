import HomeChrome from "@/components/home/HomeChrome";
import CreateStage from "@/components/home/CreateStage";
import JoinRail from "@/components/home/JoinRail";
import useAuthCommit from "@/components/home/useAuthCommit";
import useJoinResume from "@/components/home/useJoinResume";
import { useHomeIntentStore } from "@/stores/homeIntentStore";
import { useAuth } from "@clerk/react";
import { useNavigate, useLocation } from "react-router-dom";
import QuizRows from "@/components/home/QuizRows";
import LiveRoomRows from "@/components/home/LiveRoomRows";

export default function HomeWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ensureSignedIn } = useAuthCommit();
  const { isLoaded, isSignedIn } = useAuth();

  // auto-resume pending intents when Clerk finishes loading / user signs in
  useJoinResume();

  const setPendingFile = useHomeIntentStore((s) => s.setPendingFile);
  const requestCreateResume = useHomeIntentStore((s) => s.requestCreateResume);
  const setPendingJoinCode = useHomeIntentStore((s) => s.setPendingJoinCode);

  async function handleContinue(file: File) {
    setPendingFile(file);
    requestCreateResume();
    const result = await ensureSignedIn();
    if (result === "already-signed-in") {
      // consume intent then navigate
      useHomeIntentStore.getState().takeCreateResume();
      navigate("/game/create");
      return;
    }
    if (result === "fallback-required") {
      // fallback to full-page login; leave intent in store for resume
      navigate("/login", { state: { from: location } });
      return;
    }
    // modal-opened: clerk modal is visible, do nothing — resume happens via useJoinResume
  }

  async function handleJoin(code: string) {
    const normalized = code;
    if (!isLoaded || !isSignedIn) {
      // store intent then prompt sign-in
      setPendingJoinCode(normalized);
      const result = await ensureSignedIn();
      if (result === "fallback-required") {
        navigate("/login", { state: { from: location } });
        return;
      }
      if (result === "modal-opened") {
        // wait for useJoinResume to resume when modal flow completes
        return;
      }
      // already-signed-in case: consume then navigate
      const taken = useHomeIntentStore.getState().takePendingJoinCode();
      if (taken) navigate(`/game/lobby/${taken}`);
      return;
    }
    // already signed in
    navigate(`/game/lobby/${normalized}`);
  }

  return (
    <div data-theme="fluent-dark" className="min-h-dvh bg-background text-ink">
      <HomeChrome />
      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-8 lg:px-8">
        <div className="min-w-0 space-y-3">
          <h1 className="text-balance text-[32px] font-semibold leading-10 tracking-tight">
            Live quizzes from your notes
          </h1>
          {/* CreateStage slot */}
          <CreateStage onContinue={handleContinue} />
          {/* Progressive library rows */}
          <div className="mt-3">
            <QuizRows />
          </div>
        </div>
        <aside className="min-w-0 space-y-3">
          {/* JoinRail slot */}
          <section aria-label="Join rail" className="rounded-lg border border-border bg-surface/50 p-4">
            <JoinRail onJoin={handleJoin} />
          </section>
          <LiveRoomRows />
        </aside>
      </main>
    </div>
  );
}
