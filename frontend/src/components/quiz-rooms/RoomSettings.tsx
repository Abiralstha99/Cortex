import { Button } from "@/components/ui/button";
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
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-(--radius-panel) border border-border bg-cream p-4">
        <Label
          htmlFor="questions-stepper"
          className="font-display text-base font-extrabold text-ink"
        >
          How many questions?
        </Label>

        <div
          id="questions-stepper"
          className="mt-4 flex items-center justify-between gap-3"
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
          <span className="min-w-12 text-center font-mono text-2xl font-semibold text-ink">
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

        <p className="mt-3 text-center text-xs text-muted">
          {MIN_QUESTIONS} - {questionsCap} questions
        </p>
      </div>

      <div className="rounded-(--radius-panel) border border-border bg-cream p-4">
        <Label
          htmlFor="players-stepper"
          className="font-display text-base font-extrabold text-ink"
        >
          How many players?
        </Label>

        <div
          id="players-stepper"
          className="mt-4 flex items-center justify-between gap-3"
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
          <span className="min-w-12 text-center font-mono text-2xl font-semibold text-ink">
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

        <p className="mt-3 text-center text-xs text-muted">
          {MIN_PLAYERS} - {MAX_PLAYERS} players
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-(--radius-panel) border border-border bg-cream p-4 sm:col-span-2">
        <div>
          <Label
            htmlFor="public-room-switch"
            className="font-display text-base font-extrabold text-ink"
          >
            Let anyone join?
          </Label>
          <p className="mt-1 text-xs text-muted">
            Show this room in the live rooms feed.
          </p>
        </div>
        <Switch
          id="public-room-switch"
          checked={isPublic}
          onCheckedChange={(value) => onIsPublicChange(value === true)}
          aria-label="Make room public"
          className="h-7 w-12 data-[state=checked]:bg-forest data-[slot=switch-thumb]:size-6"
        />
      </div>
    </div>
  );
}
