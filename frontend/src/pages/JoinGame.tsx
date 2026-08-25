import PageShell from "@/components/layout/PageShell";
import JoinRoomPanel from "@/components/quiz-rooms/JoinRoomPanel";
import HowJoiningWorks from "@/components/quiz-rooms/HowJoiningWorks";

export default function JoinGame() {
  return (
    <PageShell maxWidth="6xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <JoinRoomPanel />
        </div>
        <div className="lg:col-span-2">
          <HowJoiningWorks />
        </div>
      </div>
    </PageShell>
  );
}
