import { Button } from "@/components/ui/button";

interface FinalCtaProps {
  onStart: () => void;
}

export function FinalCta({ onStart }: FinalCtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Ready to <span className="text-rose">rush?</span>
      </h2>
      <p className="mx-auto mb-8 max-w-md text-muted">
        Turn your study notes into competitive quizzes. Challenge friends,
        climb the leaderboard, and learn faster.
      </p>
      <Button variant="rose" size="lg" onClick={onStart}>
        Get started
      </Button>
      <p className="label-caps mt-4 text-muted">Free to start</p>
    </section>
  );
}
