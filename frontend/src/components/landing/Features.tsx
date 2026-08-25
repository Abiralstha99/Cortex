const features = [
  {
    heading: "Upload. Generate. Play.",
    description:
      "Drop in your notes - PDF or plain text - and the AI pipeline extracts structured quiz questions in seconds.",
  },
  {
    heading: "Real-time multiplayer",
    description:
      "Create a room, share the code, and race through questions together. Socket-powered, zero lag.",
  },
  {
    heading: "Placement-based scoring",
    description:
      "First correct answer earns 100 pts, second 75, third 50. Speed matters as much as knowledge.",
  },
  {
    heading: "Persistent ratings",
    description:
      "ELO-style ratings update after every match. Climb the leaderboard over time.",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <p className="label-caps mb-3 text-muted">Features</p>
      <h2 className="mb-10 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Everything you need to compete
      </h2>

      <div className="grid gap-px border-t border-border md:grid-cols-2">
        {features.map((f, i) => (
          <div
            key={f.heading}
            className={`border-b border-border px-0 py-6 md:py-8 ${
              i % 2 === 0 ? "md:pr-8" : "md:pl-8 md:border-l"
            }`}
          >
            <h3 className="mb-2 text-lg font-semibold text-ink">{f.heading}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
