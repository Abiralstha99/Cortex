import { useState } from "react";

const FILTERS = ["All", "LIVE", "WAITING", "SOLO"] as const;

export default function LiveRoomsSection() {
  const [active, setActive] = useState<string>("All");

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold text-ink mb-4">Live rooms</h2>

      <div className="flex gap-2 mb-8">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active === filter
                ? "bg-ink text-white"
                : "bg-surface border border-border text-ink hover:bg-background"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <p className="text-center text-muted py-12">
        No public rooms yet. Create one to get started.
      </p>
    </section>
  );
}
