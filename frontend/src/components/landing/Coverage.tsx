const subjects = [
  "Biology",
  "World history",
  "Psychology",
  "Computer science",
  "Literature",
  "Geography",
  "Languages",
  "Your next exam",
] as const;

export function Coverage() {
  return (
    <section id="coverage" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
        If you can study it, you can play it
      </h2>
      <div className="mt-9 flex max-w-4xl flex-wrap gap-3" aria-label="Quiz subjects">
        {subjects.map((subject, index) => (
          <span
            key={subject}
            className={`rounded-control border-2 border-ink px-5 py-2.5 font-display text-sm font-extrabold text-ink shadow-[0_3px_0_0_#1a1a1a] ${
              index % 3 === 0
                ? "bg-candy-yellow"
                : index % 3 === 1
                  ? "bg-surface"
                  : "bg-candy-sky"
            }`}
          >
            {subject}
          </span>
        ))}
      </div>
    </section>
  );
}
