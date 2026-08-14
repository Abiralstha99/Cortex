import AppHeader from "@/components/AppHeader";
import JoinRoomPanel from "@/components/quiz-rooms/JoinRoomPanel";
import HowJoiningWorks from "@/components/quiz-rooms/HowJoiningWorks";

export default function JoinGame() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <JoinRoomPanel />
          </div>
          <div className="lg:col-span-2">
            <HowJoiningWorks />
          </div>
        </div>
      </main>
    </div>
  );
}
