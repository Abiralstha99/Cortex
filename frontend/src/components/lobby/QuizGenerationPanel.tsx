import { useState, type ReactNode } from "react";
import { useAuth } from "@clerk/react";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import UploadPanel from "@/components/quiz-rooms/UploadPanel";
import { Button } from "@/components/ui/button";
import { generateQuizForGame } from "@/lib/api";
import { useLobbyStore } from "@/stores/lobbyStore";

type QuizGenerationPanelProps = {
  isHost: boolean;
};

export default function QuizGenerationPanel({
  isHost,
}: QuizGenerationPanelProps) {
  const { getToken } = useAuth();
  const gameId = useLobbyStore((state) => state.gameId);
  const quizGenStatus = useLobbyStore((state) => state.quizGenStatus);
  const quizGenError = useLobbyStore((state) => state.quizGenError);
  const numberOfRounds = useLobbyStore((state) => state.numberOfRounds);
  const applyQuizStatus = useLobbyStore((state) => state.applyQuizStatus);

  const [file, setFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const effectiveQuestionCount = questionCount ?? numberOfRounds ?? 10;

  async function handleRetry() {
    if (!file || !gameId) return;

    setIsRetrying(true);
    setRetryError(null);

    try {
      const token = await getToken();
      await generateQuizForGame(
        token,
        gameId,
        file,
        effectiveQuestionCount,
        quizTitle.trim() || undefined,
      );
      applyQuizStatus({
        quizId: null,
        quizGenStatus: "processing",
        quizGenError: null,
      });
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : "Failed to retry generation",
      );
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <section
      className="mb-8 rounded-xl border border-border bg-surface p-5"
      aria-live="polite"
    >
      {quizGenStatus === "processing" && (
        <StatusRow
          icon={<Clock3 className="size-5 text-rose" />}
          title="Generating questions…"
          detail="The quiz will be available here when it is ready."
        />
      )}

      {quizGenStatus === "ready" && (
        <StatusRow
          icon={<CheckCircle2 className="size-5 text-code" />}
          title="Quiz ready"
          detail={
            numberOfRounds != null
              ? `${numberOfRounds} questions ready to play`
              : "Ready to play"
          }
        />
      )}

      {quizGenStatus === "none" && (
        <StatusRow
          icon={<Clock3 className="size-5 text-muted" />}
          title="Waiting for quiz"
          detail="The host is preparing the questions."
        />
      )}

      {quizGenStatus === "failed" && (
        <div className="space-y-4">
          <StatusRow
            icon={<AlertCircle className="size-5 text-rose" />}
            title="Quiz generation failed"
            detail={quizGenError ?? "The questions could not be generated."}
          />

          {isHost ? (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-ink">
                Upload the source again to retry
              </p>
              <UploadPanel
                file={file}
                count={effectiveQuestionCount}
                onFileChange={setFile}
                onCountChange={setQuestionCount}
                title={quizTitle}
                onTitleChange={setQuizTitle}
              />
              {retryError && (
                <p className="mt-3 text-sm text-rose">{retryError}</p>
              )}
              <Button
                type="button"
                variant="rose"
                className="mt-4 w-full"
                disabled={!file || !gameId || isRetrying}
                onClick={handleRetry}
              >
                <RefreshCw />
                {isRetrying ? "Retrying…" : "Retry generation"}
              </Button>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted">
              The host can upload the source again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function StatusRow({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <h2 className="text-balance text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-pretty text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
