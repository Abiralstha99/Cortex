import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import PageShell from "@/components/layout/PageShell";
import {
  createWaitingGame,
  generateQuizForGame,
  listQuizzes,
  markWaitingQuizFailed,
  type QuizSummary,
} from "@/lib/api";
import QuizPickerList from "@/components/quiz-rooms/QuizPickerList";
import RoomPreviewCard from "@/components/quiz-rooms/RoomPreviewCard";
import RoomSettings from "@/components/quiz-rooms/RoomSettings";
import UploadPanel from "@/components/quiz-rooms/UploadPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { titleFromFilename } from "@/lib/upload-validation";
import {
  clearFileHandoffCache,
  consumePendingFileForCreate,
} from "@/stores/homeIntentStore";

type CreationSource = "upload" | "past";

export default function CreateGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  // Read deep-linked quizId from location.state without using `any`
  const initialQuizId = (location.state as { quizId?: string } | null)?.quizId;

  const [activeTab, setActiveTab] = useState<CreationSource>(() =>
    initialQuizId ? "past" : "upload",
  );
  const [uploadFile, setUploadFile] = useState<File | null>(() =>
    consumePendingFileForCreate(),
  );
  const [quizTitle, setQuizTitle] = useState(() => {
    const file = consumePendingFileForCreate();
    return file ? titleFromFilename(file.name) : "";
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPublic, setIsPublic] = useState(false);

  const quizzesQuery = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const token = await getToken();
      return listQuizzes(token);
    },
  });

  // Derive a linked quiz from the loaded list when present; prefer explicit user selection.
  const linkedQuiz = useMemo(() => {
    const list: QuizSummary[] = quizzesQuery.data ?? [];
    return initialQuizId ? list.find((q) => q.id === initialQuizId) ?? null : null;
  }, [quizzesQuery.data, initialQuizId]);

  const effectiveSelected = selectedQuiz ?? linkedQuiz;

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      if (activeTab === "upload") {
        if (!uploadFile) throw new Error("Choose a PDF or TXT file");

        // Play one round per generated question.
        const game = await createWaitingGame(token, {
          rounds: questionCount,
          maxPlayers,
          isPublic,
        });
        return {
          game,
          generation: {
            token,
            file: uploadFile,
            count: questionCount,
            title: quizTitle.trim() || undefined,
          },
        };
      }

      const chosen = effectiveSelected;
      if (!chosen) throw new Error("No quiz selected");
      const game = await createWaitingGame(token, {
        quizId: chosen.id,
        rounds: Math.min(questionCount, chosen.questionCount),
        maxPlayers,
        isPublic,
      });
      return { game, generation: null };
    },
    onSuccess: (data) => {
      navigate(`/game/lobby/${data.game.roomCode}`);

      if (data.generation) {
        const { token, file, count, title } = data.generation;
        void generateQuizForGame(token, data.game.gameId, file, count, title).catch(
          async (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to start quiz generation";
            await markWaitingQuizFailed(token, data.game.gameId, message).catch(() => {
              // Best-effort recovery; the original generation error is primary.
            });
          },
        );
      }
    },
  });

  const canLaunch = activeTab === "upload" ? uploadFile !== null : effectiveSelected !== null;
  const previewTitle =
    activeTab === "upload"
      ? quizTitle.trim() || uploadFile?.name.replace(/\.(pdf|txt)$/i, "") || null
      : effectiveSelected?.title ?? null;
  const pastQuizCap = effectiveSelected?.questionCount ?? null;
  const previewQuestionCount =
    activeTab === "upload" ? questionCount : pastQuizCap != null ? Math.min(questionCount, pastQuizCap) : null;

  return (
    <PageShell maxWidth="6xl">
      <header className="mb-8 max-w-2xl sm:mb-10">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">Create a game</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Upload your notes or choose a past quiz, then set up the room.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="quiz-source-heading" className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-5">
              <h2 id="quiz-source-heading" className="text-xl font-bold text-ink">Choose your quiz</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Start from a file or reuse one of your ready quizzes.</p>
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CreationSource)}>
              <TabsList className="h-12 w-full sm:w-fit">
                <TabsTrigger value="upload" className="min-h-11 px-5">Upload notes</TabsTrigger>
                <TabsTrigger value="past" className="min-h-11 px-5">Past quizzes</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-5">
                {uploadFile ? (
                  <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-surface p-4">
                    <div className="min-w-0">
                      <p className="max-w-full truncate font-medium text-ink">{uploadFile.name}</p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Return to the full upload panel without navigating away.
                          clearFileHandoffCache();
                          setUploadFile(null);
                        }}
                      >
                        Change file
                      </Button>
                    </div>
                  </div>
                ) : (
                  <UploadPanel file={uploadFile} onFileChange={setUploadFile} title={quizTitle} onTitleChange={setQuizTitle} />
                )}
              </TabsContent>
              <TabsContent value="past">
                <QuizPickerList
                  quizzes={quizzesQuery.data ?? []}
                  isLoading={quizzesQuery.isLoading}
                  error={quizzesQuery.error}
                  selectedId={selectedQuiz?.id ?? linkedQuiz?.id ?? null}
                  onSelect={(quiz) => {
                    setSelectedQuiz(quiz);
                    setQuestionCount(Math.min(questionCount, quiz.questionCount));
                  }}
                />
              </TabsContent>
            </Tabs>
          </section>

          <section aria-labelledby="room-settings-heading" className="rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-5">
              <h2 id="room-settings-heading" className="text-xl font-bold text-ink">Set up the room</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Pick the pace and decide who can find it.</p>
            </div>
            <RoomSettings
              players={maxPlayers}
              onPlayersChange={setMaxPlayers}
              questions={questionCount}
              onQuestionsChange={setQuestionCount}
              isPublic={isPublic}
              onIsPublicChange={setIsPublic}
              maxQuestions={activeTab === "past" && pastQuizCap != null ? pastQuizCap : undefined}
            />
          </section>

          {mutation.error && (
            <p role="alert" className="rounded-[var(--radius-control)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger-foreground">
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create game"}
            </p>
          )}

          <Button size="lg" className="w-full" disabled={!canLaunch || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Creating..." : "Launch lobby"}
          </Button>
        </div>

        <div className="min-w-0">
          <RoomPreviewCard quizTitle={previewTitle} questionCount={previewQuestionCount} maxPlayers={maxPlayers} isPublic={isPublic} />
        </div>
      </div>
    </PageShell>
  );
}
