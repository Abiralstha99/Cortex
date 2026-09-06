import HomeChrome from "@/components/home/HomeChrome";
import CreateStage from "@/components/home/CreateStage";

export default function HomeWorkspace() {
  return (
    <div data-theme="fluent-dark" className="min-h-dvh bg-background text-ink">
      <HomeChrome />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-5">
        <div className="min-w-0 space-y-3">
          <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            Live quizzes from your notes
          </h1>
          {/* CreateStage slot */}
          <CreateStage onContinue={() => {}} />
        </div>
        <aside className="min-w-0">
          {/* JoinRail slot */}
          <section aria-label="Join rail placeholder" className="rounded-lg border border-border bg-surface/50 p-4">
            <p className="text-sm text-muted-foreground">Join rail (coming soon)</p>
          </section>
        </aside>
      </main>
    </div>
  );
}

