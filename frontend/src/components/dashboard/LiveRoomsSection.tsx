import PublicRoomsList from "@/components/dashboard/PublicRoomsList";

export default function LiveRoomsSection() {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold text-ink mb-4">Live rooms</h2>
      <PublicRoomsList />
    </section>
  );
}
