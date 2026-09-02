import type { ReactNode } from "react";
import { BookOpen, Globe2, LockKeyhole, Users } from "lucide-react";

interface RoomPreviewCardProps {
  quizTitle: string | null;
  questionCount: number | null;
  maxPlayers: number;
  isPublic: boolean;
}

export default function RoomPreviewCard({
  quizTitle,
  questionCount,
  maxPlayers,
  isPublic,
}: RoomPreviewCardProps) {
  return (
    <aside className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-card xl:sticky xl:top-24">
      <div className="border-b border-border bg-primary-soft px-6 py-5">
        <p className="text-sm font-semibold text-primary">Room preview</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">
          {quizTitle ?? (
            <span className="text-text-muted-foreground">Select a quiz</span>
          )}
        </h2>
      </div>

      <div className="px-6 py-5">
        <dl className="space-y-4">
          <PreviewDetail
            icon={<BookOpen aria-hidden="true" />}
            label="Questions"
            value={questionCount !== null ? String(questionCount) : "Not set"}
          />
          <PreviewDetail
            icon={<Users aria-hidden="true" />}
            label="Players"
            value={String(maxPlayers)}
          />
          <PreviewDetail
            icon={
              isPublic ? (
                <Globe2 aria-hidden="true" />
              ) : (
                <LockKeyhole aria-hidden="true" />
              )
            }
            label="Visibility"
            value={isPublic ? "Public" : "Private"}
          />
        </dl>

        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-semibold text-ink">Before you launch</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Share the room code, then wait for everyone to get ready.
          </p>
        </div>
      </div>
    </aside>
  );
}

function PreviewDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-subtle text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}
