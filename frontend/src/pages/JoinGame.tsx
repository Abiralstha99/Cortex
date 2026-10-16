import PageShell from "@/components/layout/PageShell";
import PreGameModeSwitch from "@/components/layout/PreGameModeSwitch";
import JoinRoomPanel from "@/components/quiz-rooms/JoinRoomPanel";

export default function JoinGame() {
  return (
    <PageShell maxWidth="6xl" variant="preGame" className="editorial-setup">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-danger-foreground">Play together</p>
            <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">Got a game code?</h1>
          </div>
          <PreGameModeSwitch />
        </header>

        <JoinRoomPanel />
      </div>
    </PageShell>
  );
}
