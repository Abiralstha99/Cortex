interface RoomPreviewCardProps {
  quizTitle: string | null;
  questionCount: number | null;
  rounds: number;
}

export default function RoomPreviewCard({
  quizTitle,
  questionCount,
  rounds,
}: RoomPreviewCardProps) {
  return (
    <div className="sticky top-24 rounded-2xl bg-preview p-6 text-white">
      <p className="label-caps text-white/60">Room Preview</p>

      <h2 className="mt-4 text-lg font-semibold text-white">
        {quizTitle ?? (
          <span className="text-white/50">Select a quiz</span>
        )}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-rose/20 px-2.5 py-1 text-xs font-medium text-rose">
          {rounds} rounds
        </span>
        {questionCount !== null && (
          <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
            {questionCount} questions
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="label-caps text-white/60">Tips</p>
        <ul className="mt-2 space-y-1 text-sm text-white/80">
          <li>• Share the room code with friends to join</li>
          <li>• All players must ready up before starting</li>
        </ul>
      </div>
    </div>
  );
}
