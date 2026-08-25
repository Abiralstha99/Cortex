import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RoomSettingsProps {
  players: number;
  onPlayersChange: (n: number) => void;
  questions: number;
  onQuestionsChange: (n: number) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  /** Upper bound for questions (e.g. selected past quiz size). Defaults to 50. */
  maxQuestions?: number;
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MIN_QUESTIONS = 5;
const DEFAULT_MAX_QUESTIONS = 50;
const QUESTION_STEP = 5;

export default function RoomSettings({
  players,
  onPlayersChange,
  questions,
  onQuestionsChange,
  isPublic,
  onIsPublicChange,
  maxQuestions = DEFAULT_MAX_QUESTIONS,
}: RoomSettingsProps) {
  const questionsCap = Math.max(MIN_QUESTIONS, maxQuestions);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="questions-stepper">Questions</Label>

        <div id="questions-stepper" className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onQuestionsChange(
                Math.max(MIN_QUESTIONS, questions - QUESTION_STEP),
              )
            }
            disabled={questions <= MIN_QUESTIONS}
            aria-label="Decrease questions"
            className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center font-mono text-xl font-semibold text-ink">
            {questions}
          </span>
          <button
            type="button"
            onClick={() =>
              onQuestionsChange(
                Math.min(questionsCap, questions + QUESTION_STEP),
              )
            }
            disabled={questions >= questionsCap}
            aria-label="Increase questions"
            className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="text-xs text-muted">
          {MIN_QUESTIONS} - {questionsCap} questions
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="players-stepper">Players</Label>

        <div id="players-stepper" className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPlayersChange(Math.max(MIN_PLAYERS, players - 1))}
            disabled={players <= MIN_PLAYERS}
            aria-label="Decrease players"
            className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
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
            className="flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-lg font-medium text-ink transition-colors hover:bg-surface disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="text-xs text-muted">
          {MIN_PLAYERS} - {MAX_PLAYERS} players
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="public-room-switch">Public room</Label>
          <p className="mt-1 text-xs text-muted">
            Visible in the live rooms feed
          </p>
        </div>
        <Switch
          id="public-room-switch"
          checked={isPublic}
          onCheckedChange={(value) => onIsPublicChange(value === true)}
          aria-label="Make room public"
        />
      </div>
    </div>
  );
}
