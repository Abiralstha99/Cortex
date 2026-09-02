import { useUser } from "@clerk/react";
import PageShell from "@/components/layout/PageShell";
import DashboardHero from "@/components/dashboard/DashboardHero";
import LiveRoomsSection from "@/components/dashboard/LiveRoomsSection";

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName ?? null;

  return (
    <PageShell maxWidth="6xl" aside={<LiveRoomsSection />}>
      <DashboardHero firstName={firstName} />
    </PageShell>
  );
}
