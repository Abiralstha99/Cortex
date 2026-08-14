interface RoomSettingsProps {
  rounds: number;
  maxRounds: number;
  onRoundsChange: (n: number) => void;
}

export default function RoomSettings({
  rounds,
  maxRounds,
  onRoundsChange,
}: RoomSettingsProps) {
  const minRounds = 3;

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted">Rounds</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onRoundsChange(Math.max(minRounds, rounds - 1))}
          disabled={rounds <= minRounds}
          aria-label="Decrease rounds"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center font-mono text-xl font-semibold text-ink">
          {rounds}
        </span>
        <button
          type="button"
          onClick={() => onRoundsChange(Math.min(maxRounds, rounds + 1))}
          disabled={rounds >= maxRounds}
          aria-label="Increase rounds"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
        >
          +
        </button>
      </div>

      <p className="text-xs text-muted">
        {minRounds} – {maxRounds} rounds
      </p>
    </div>
  );
}
