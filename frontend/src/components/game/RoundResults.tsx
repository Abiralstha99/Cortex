import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { RoundFinishedPayload } from "@/lib/api";
import Leaderboard from "@/components/game/Leaderboard";
import { cn } from "@/lib/utils";

type RoundResultsProps = {
  roundResults: RoundFinishedPayload;
  myPlayerId: string;
};

type Submission = RoundFinishedPayload["submissions"][number];

function SubmissionDetails({
  submission,
  username,
}: {
  submission: Submission;
  username: string;
}) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-display font-semibold text-ink">
          {username}
        </span>
        <span className="text-xs font-semibold text-primary">You</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-semibold",
            submission.correct
              ? "text-success-foreground"
              : "text-danger-foreground",
          )}
        >
          {submission.correct ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <XCircle className="size-4" aria-hidden="true" />
          )}
          {submission.correct ? "Correct" : "Not quite"}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-ink">
          +{submission.pointsEarned}
        </span>
        {submission.placement && (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {submission.placement === 1
              ? "1st"
              : submission.placement === 2
                ? "2nd"
                : submission.placement === 3
                  ? "3rd"
                  : `${submission.placement}th`}
            {" place"}
          </span>
        )}
      </div>
    </>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 28 },
  },
};

export default function RoundResults({ roundResults, myPlayerId }: RoundResultsProps) {
  const { roundNumber, submissions, leaderboard, isLastRound, nextRoundIn } = roundResults;
  const reduce = useReducedMotion();
  const mySubmission = submissions.find((sub) => sub.playerId === myPlayerId);
  const myUsername = leaderboard.find(
    (player) => player.playerId === myPlayerId,
  )?.username;
  const answerRowClassName = cn(
    "flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border px-4 py-2",
    mySubmission
      ? "border-primary/40 bg-primary-soft"
      : "border-border bg-subtle",
  );
  const answerDetails = mySubmission ? (
    <SubmissionDetails
      submission={mySubmission}
      username={myUsername ?? "Unknown"}
    />
  ) : (
    <p className="text-sm font-semibold text-muted-foreground">
      No answer submitted
    </p>
  );

  return (
    <div className="editorial-round-results space-y-6">
      <section className="editorial-stage rounded-[var(--radius-panel)] border border-primary/20 bg-primary-soft p-6 shadow-card">
        <h1 className="mb-2 text-balance font-display text-2xl font-bold text-ink">
          Round {roundNumber} complete
        </h1>
        <p className="text-pretty text-muted-foreground">Review answers after the game.</p>
      </section>

      <section className="editorial-stage rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">
          Your answer
        </h2>
        {reduce ? (
          <div className="space-y-2">
            <div className={answerRowClassName}>{answerDetails}</div>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className={answerRowClassName}>
              {answerDetails}
            </motion.div>
          </motion.div>
        )}
      </section>

      <Leaderboard entries={leaderboard} highlightPlayerId={myPlayerId} />

      {!isLastRound && (
        <p className="text-center font-mono text-sm font-semibold tabular-nums text-muted-foreground">
          Next round in {Math.ceil(nextRoundIn / 1000)}s...
        </p>
      )}
    </div>
  );
}
