import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
    <div className="divide-y divide-border rounded-[var(--radius-card)] bg-subtle px-4 sm:px-5">
      <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
        <p id="questions-label" className="text-base font-semibold text-ink">
          Questions
        </p>

        <div
          id="questions-stepper"
          role="group"
          aria-labelledby="questions-label"
          className="flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              onQuestionsChange(
                Math.max(MIN_QUESTIONS, questions - QUESTION_STEP),
              )
            }
            disabled={questions <= MIN_QUESTIONS}
            aria-label="Decrease questions"
          >
            <span className="text-lg" aria-hidden="true">
              −
            </span>
          </Button>
          <span className="min-w-12 text-center font-mono text-xl font-semibold tabular-nums text-ink">
            {questions}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              onQuestionsChange(
                Math.min(questionsCap, questions + QUESTION_STEP),
              )
            }
            disabled={questions >= questionsCap}
            aria-label="Increase questions"
          >
            <span className="text-lg" aria-hidden="true">
              +
            </span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground sm:col-start-2 sm:text-center">
          {MIN_QUESTIONS} - {questionsCap} questions
        </p>
      </div>

      <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
        <p id="players-label" className="text-base font-semibold text-ink">
          Players
        </p>

        <div
          id="players-stepper"
          role="group"
          aria-labelledby="players-label"
          className="flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPlayersChange(Math.max(MIN_PLAYERS, players - 1))}
            disabled={players <= MIN_PLAYERS}
            aria-label="Decrease players"
          >
            <span className="text-lg" aria-hidden="true">
              −
            </span>
          </Button>
          <span className="min-w-12 text-center font-mono text-xl font-semibold tabular-nums text-ink">
            {players}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPlayersChange(Math.min(MAX_PLAYERS, players + 1))}
            disabled={players >= MAX_PLAYERS}
            aria-label="Increase players"
          >
            <span className="text-lg" aria-hidden="true">
              +
            </span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground sm:col-start-2 sm:text-center">
          {MIN_PLAYERS} - {MAX_PLAYERS} players
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 py-5">
        <div>
          <label
            htmlFor="public-room-switch"
            className="text-base font-semibold text-ink"
          >
            Public room
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Show this room in the live rooms feed.
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
