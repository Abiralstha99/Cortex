const subjects = [
  { name: "Biology", count: 42, bgClass: "bg-pastel-mint" },
  { name: "History", count: 38, bgClass: "bg-pastel-cream" },
  { name: "Computer Science", count: 56, bgClass: "bg-pastel-lavender" },
  { name: "Chemistry", count: 31, bgClass: "bg-pastel-blush" },
  { name: "Economics", count: 27, bgClass: "bg-pastel-cream" },
  { name: "Literature", count: 19, bgClass: "bg-pastel-lavender" },
  { name: "Physics", count: 34, bgClass: "bg-pastel-mint" },
  { name: "Psychology", count: 23, bgClass: "bg-pastel-blush" },
];

export function Coverage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="label-caps mb-3 text-muted">COVERAGE</p>
      <h2 className="mb-8 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Any subject, any notes
      </h2>

      <div className="flex flex-wrap gap-3">
        {subjects.map((s) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-full border border-border/50 px-4 py-2 text-sm font-medium text-ink ${s.bgClass}`}
          >
            {s.name}
            <span className="font-mono text-xs text-muted">{s.count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
