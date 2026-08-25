import { useUser } from "@clerk/react";
import PageShell from "@/components/layout/PageShell";
import HostJoinCards from "@/components/dashboard/HostJoinCards";
import LiveRoomsSection from "@/components/dashboard/LiveRoomsSection";

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName ?? null;

  return (
    <PageShell>
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-ink">
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </h1>
      </div>
      <HostJoinCards />
      <LiveRoomsSection />
    </PageShell>
  );
}
