import PublicRoomsList from "@/components/dashboard/PublicRoomsList";

export default function LiveRoomsSection() {
  return (
    <section aria-labelledby="live-rooms-heading">
      <div className="mb-4">
        <h2
          id="live-rooms-heading"
          className="text-balance text-2xl tracking-tight text-ink"
        >
          Live now
        </h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Join an open room while there is still space.
        </p>
      </div>
      <PublicRoomsList compactEmptyState />
    </section>
  );
}
