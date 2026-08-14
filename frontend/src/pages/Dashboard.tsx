import AppHeader from "@/components/AppHeader";
import HostJoinCards from "@/components/dashboard/HostJoinCards";
import LiveRoomsSection from "@/components/dashboard/LiveRoomsSection";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-10 text-center">
          <p className="label-caps text-muted mb-2">BUILT FOR STUDENTS</p>
          <h1 className="text-3xl font-normal text-ink">
            Good to have <span className="font-semibold">you back.</span>
          </h1>
        </div>
        <HostJoinCards />
        <LiveRoomsSection />
      </main>
    </div>
  );
}
