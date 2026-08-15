interface RoomSettingsProps {
  players: number;
  onPlayersChange: (n: number) => void;
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

export default function RoomSettings({
  players,
  onPlayersChange,
}: RoomSettingsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted">Players</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPlayersChange(Math.max(MIN_PLAYERS, players - 1))}
          disabled={players <= MIN_PLAYERS}
          aria-label="Decrease players"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center font-mono text-xl font-semibold text-ink">
          {players}
        </span>
        <button
          type="button"
          onClick={() => onPlayersChange(Math.min(MAX_PLAYERS, players + 1))}
          disabled={players >= MAX_PLAYERS}
          aria-label="Increase players"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
        >
          +
        </button>
      </div>

      <p className="text-xs text-muted">
        {MIN_PLAYERS} – {MAX_PLAYERS} players
      </p>
    </div>
  );
}
