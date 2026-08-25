import { Button } from "@/components/ui/button";

interface FinalCtaProps {
  onStart: () => void;
}

export function FinalCta({ onStart }: FinalCtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center">
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Ready to <span className="text-rose">compete?</span>
      </h2>
      <p className="mx-auto mb-8 max-w-md text-muted">
        Turn your study notes into competitive quizzes. Challenge friends
        and climb the leaderboard.
      </p>
      <Button variant="rose" size="lg" onClick={onStart}>
        Create quiz
      </Button>
    </section>
  );
}
