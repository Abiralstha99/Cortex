const features = [
  {
    label: "AI GENERATION",
    heading: "Upload. Generate. Play.",
    description:
      "Drop in your notes — PDF or plain text — and our AI pipeline extracts structured quiz questions in seconds.",
    bgClass: "bg-pastel-cream",
  },
  {
    label: "MULTIPLAYER",
    heading: "Real-time battles",
    description:
      "Create a room, share the code, and race through questions together. Socket-powered, zero lag.",
    bgClass: "bg-pastel-mint",
  },
  {
    label: "SCORING",
    heading: "Placement-based points",
    description:
      "First correct answer earns 100 pts, second 75, third 50. Speed matters as much as knowledge.",
    bgClass: "bg-pastel-lavender",
  },
  {
    label: "LEADERBOARD",
    heading: "Track your rating",
    description:
      "Persistent ELO-style ratings. Every match updates your rank — climb the leaderboard over time.",
    bgClass: "bg-pastel-blush",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <p className="label-caps mb-3 text-muted">FEATURES</p>
      <h2 className="mb-10 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Everything you need to compete
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.label}
            className={`rounded-2xl border border-border/50 p-8 ${f.bgClass}`}
          >
            <p className="label-caps mb-3 text-muted">{f.label}</p>
            <h3 className="mb-2 text-xl font-bold text-ink">{f.heading}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
