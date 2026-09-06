import HomeChrome from "@/components/home/HomeChrome";
import CreateStage from "@/components/home/CreateStage";
import JoinRail from "@/components/home/JoinRail";
import useAuthCommit from "@/components/home/useAuthCommit";
import useJoinResume from "@/components/home/useJoinResume";
import { useHomeIntentStore } from "@/stores/homeIntentStore";
import { useUser } from "@clerk/react";
import { useNavigate, useLocation } from "react-router-dom";

export default function HomeWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ensureSignedIn } = useAuthCommit();
  const { isLoaded, user } = useUser();

  // auto-resume pending intents when Clerk finishes loading / user signs in
  useJoinResume();

  const setPendingFile = useHomeIntentStore((s) => s.setPendingFile);
  const requestCreateResume = useHomeIntentStore((s) => s.requestCreateResume);
  const setPendingJoinCode = useHomeIntentStore((s) => s.setPendingJoinCode);

  async function handleContinue(file: File) {
    setPendingFile(file);
    requestCreateResume();
    const ok = await ensureSignedIn();
    if (!ok) {
      // fallback to full-page login; leave intent in store for resume
      navigate("/login", { state: { from: location } });
      return;
    }
    // navigate immediately after ensuring signed in
    navigate("/game/create");
  }

  async function handleJoin(code: string) {
    const normalized = code;
    if (!isLoaded || !user) {
      // store intent then prompt sign-in
      setPendingJoinCode(normalized);
      const ok = await ensureSignedIn();
      if (!ok) {
        navigate("/login", { state: { from: location } });
        return;
      }
      // take pending code BEFORE navigate to avoid StrictMode double-resume
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
      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-5">
        <div className="min-w-0 space-y-3">
          <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            Live quizzes from your notes
          </h1>
          {/* CreateStage slot */}
          <CreateStage onContinue={handleContinue} />
        </div>
        <aside className="min-w-0">
          {/* JoinRail slot */}
          <section aria-label="Join rail" className="rounded-lg border border-border bg-surface/50 p-4">
            <JoinRail onJoin={handleJoin} />
          </section>
        </aside>
      </main>
    </div>
  );
}

