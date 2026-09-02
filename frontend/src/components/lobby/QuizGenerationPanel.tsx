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
      className="mb-8 rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-card sm:p-6"
      aria-live="polite"
    >
      {quizGenStatus === "processing" && (
        <StatusRow
          tone="info"
          icon={<Clock3 />}
          title="Generating questions..."
          detail="The quiz will be available here when it is ready."
        />
      )}

      {quizGenStatus === "ready" && (
        <StatusRow
          tone="success"
          icon={<CheckCircle2 />}
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
          tone="neutral"
          icon={<Clock3 />}
          title="Waiting for quiz"
          detail="The host is preparing the questions."
        />
      )}

      {quizGenStatus === "failed" && (
        <div className="space-y-4">
          <StatusRow
            tone="danger"
            icon={<AlertCircle />}
            title="We couldn't finish this quiz."
            detail={quizGenError ?? "The questions could not be generated."}
          />

          {isHost ? (
            <div className="border-t border-border pt-5">
              <p className="mb-4 text-sm font-medium text-ink">
                Select the PDF or TXT file again to retry.
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
                <p className="mt-3 text-sm font-medium text-danger-foreground" role="alert">
                  {retryError}
                </p>
              )}
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={!file || !gameId || isRetrying}
                onClick={handleRetry}
              >
                <RefreshCw />
                {isRetrying ? "Retrying..." : "Retry generation"}
              </Button>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              The host can select the source again and retry.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function StatusRow({
  icon,
  tone,
  title,
  detail,
}: {
  icon: ReactNode;
  tone: "info" | "success" | "neutral" | "danger";
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] [&_svg]:size-5 ${
          tone === "success"
            ? "bg-success-soft text-success"
            : tone === "danger"
              ? "bg-danger-soft text-danger"
              : tone === "info"
                ? "bg-primary-soft text-primary"
                : "bg-subtle text-muted"
        }`}
      >
        {icon}
      </span>
      <div>
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
