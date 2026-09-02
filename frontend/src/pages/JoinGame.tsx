import PageShell from "@/components/layout/PageShell";
import JoinRoomPanel from "@/components/quiz-rooms/JoinRoomPanel";
import HowJoiningWorks from "@/components/quiz-rooms/HowJoiningWorks";

export default function JoinGame() {
  return (
    <PageShell maxWidth="6xl">
      <header className="mb-8 max-w-2xl sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Join a game
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Enter a room code or choose a public room that is live now.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0">
          <JoinRoomPanel />
        </div>
        <div className="min-w-0">
          <HowJoiningWorks />
        </div>
      </div>
    </PageShell>
  );
}
