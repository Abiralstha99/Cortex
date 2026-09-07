import PageShell from "@/components/layout/PageShell";
import PreGameModeSwitch from "@/components/layout/PreGameModeSwitch";
import JoinRoomPanel from "@/components/quiz-rooms/JoinRoomPanel";

export default function JoinGame() {
  return (
    <PageShell maxWidth="6xl" variant="preGame">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <h1 className="text-[32px] font-semibold leading-10 tracking-tight text-ink">
            Join a game
          </h1>
          <PreGameModeSwitch />
        </header>

        <JoinRoomPanel />
      </div>
    </PageShell>
  );
}
