import PublicRoomsList from "@/components/dashboard/PublicRoomsList";

export default function LiveRoomsSection() {
  return (
    <section className="mt-16" aria-labelledby="live-rooms-heading">
      <div className="mb-5">
        <h2
          id="live-rooms-heading"
          className="text-balance font-display text-2xl font-extrabold text-ink"
        >
          Live public rooms
        </h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Pick an open room and join while there is still space.
        </p>
      </div>
      <PublicRoomsList />
    </section>
  );
}
