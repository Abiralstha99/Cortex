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
    <aside className="sticky top-24 overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-white p-1.5 shadow-[0_6px_0_0_rgb(0_0_0/0.06)]">
      <div className="rounded-[1.25rem] bg-gradient-to-b from-[#222222] to-[#111111] p-7">
        <p className="font-mono text-xs font-semibold text-[#f5d76e]">
          Room preview
        </p>

        <h2 className="mt-4 font-display text-2xl font-extrabold text-white">
          {quizTitle ?? (
            <span className="text-white/35">Select a quiz</span>
          )}
        </h2>

        <div className="mt-5 flex flex-wrap gap-2">
          {questionCount !== null && (
            <span className="rounded-full bg-[#ff8fb8] px-4 py-1.5 font-mono text-xs font-semibold text-ink">
              {questionCount} questions
            </span>
          )}
          <span className="rounded-full border border-white/12 bg-white/8 px-4 py-1.5 font-mono text-xs font-semibold text-white/85">
            {maxPlayers} players
          </span>
          <span className="rounded-full border border-white/12 bg-white/8 px-4 py-1.5 font-mono text-xs font-semibold text-white/85">
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        <div className="mt-8 border-t border-white/8 pt-6">
          <p className="font-display text-base font-extrabold text-white">
            Good to know
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-white/55">
            <li>Share the room code so friends can jump in.</li>
            <li>Everyone readies up before the first question.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
