import { useUser } from "@clerk/react";
import PageShell from "@/components/layout/PageShell";
import HostJoinCards from "@/components/dashboard/HostJoinCards";
import LiveRoomsSection from "@/components/dashboard/LiveRoomsSection";

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName ?? null;

  return (
    <PageShell>
      <div className="mb-10 max-w-2xl">
        <h1 className="text-balance font-display text-4xl font-extrabold text-ink sm:text-5xl">
          Ready to play{firstName ? `, ${firstName}` : ""}?
        </h1>
        <p className="mt-3 text-pretty text-base text-muted">
          Build a quiz from your notes or jump into a room with friends.
        </p>
      </div>
      <HostJoinCards />
      <LiveRoomsSection />
    </PageShell>
  );
}
