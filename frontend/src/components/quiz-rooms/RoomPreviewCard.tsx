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
    <aside className="gloss-sheen sticky top-24 rounded-(--radius-panel) border border-white/10 bg-gloss p-6 text-white shadow-[0_8px_0_0_rgb(18_18_18/0.16)]">
      <p className="font-mono text-xs font-semibold text-candy-yellow">
        Room preview
      </p>

      <h2 className="mt-4 font-display text-2xl font-extrabold text-white">
        {quizTitle ?? (
          <span className="text-white/50">Select a quiz</span>
        )}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {questionCount !== null && (
          <span className="rounded-control bg-candy-pink px-3 py-1.5 font-mono text-xs font-semibold text-ink">
            {questionCount} questions
          </span>
        )}
        <span className="rounded-control border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-white">
          {maxPlayers} players
        </span>
        <span className="rounded-control border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-white">
          {isPublic ? "Public" : "Private"}
        </span>
      </div>

      <div className="mt-7 border-t border-white/15 pt-5">
        <p className="font-display font-extrabold text-white">Good to know</p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-white/75">
          <li>Share the room code so friends can jump in.</li>
          <li>Everyone readies up before the first question.</li>
        </ul>
      </div>
    </aside>
  );
}
