import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { motion, useReducedMotion } from "motion/react";
import PageShell from "@/components/layout/PageShell";
import PreGameModeSwitch from "@/components/layout/PreGameModeSwitch";
import {
  createWaitingGame,
  generateQuizForGame,
  listQuizzes,
  markWaitingQuizFailed,
  type QuizSummary,
} from "@/lib/api";
import QuizPickerList from "@/components/quiz-rooms/QuizPickerList";
import RoomSettings from "@/components/quiz-rooms/RoomSettings";
import UploadPanel from "@/components/quiz-rooms/UploadPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const prefersReducedMotion = useReducedMotion();
  // Read deep-linked quizId from location.state without using `any`
  const initialQuizId = (location.state as { quizId?: string } | null)?.quizId;

  const [activeTab, setActiveTab] = useState<CreationSource>(() =>
    initialQuizId ? "past" : "upload",
  );
  const [uploadFile, setUploadFile] = useState<File | null>(() =>
    consumePendingFileForCreate(),
  );
  const [quizTitle, setQuizTitle] = useState(() =>
    uploadFile ? titleFromFilename(uploadFile.name) : "",
  );
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
  const pastQuizCap = effectiveSelected?.questionCount ?? null;

  return (
    <PageShell maxWidth="6xl" variant="preGame" className="editorial-setup editorial-create">
      <div className="editorial-create-content mx-auto">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-danger-foreground">Make a quiz</p>
            <h1 className="text-balance text-[32px] font-semibold leading-10 tracking-tight text-ink">What are we studying?</h1>
          </div>
          <PreGameModeSwitch />
        </header>

        <div className="editorial-create-panel">
          <div className="editorial-create-grid">
          <motion.section
            aria-labelledby="quiz-source-heading"
            className="editorial-create-quiz"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5">
              <h2 id="quiz-source-heading" className="text-lg font-semibold text-ink">Quiz</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Start from a file or reuse one of your ready quizzes.</p>
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CreationSource)}>
              <TabsList className="h-12 w-full sm:w-fit">
                <TabsTrigger value="upload" className="min-h-11 px-5">Upload notes</TabsTrigger>
                <TabsTrigger value="past" className="min-h-11 px-5">Past quizzes</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-5">
                {uploadFile ? (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-subtle p-4">
                    <div className="min-w-0">
                      <p className="max-w-full truncate text-sm font-semibold leading-5 text-ink">{uploadFile.name}</p>
                      <p className="mt-1 font-mono text-xs leading-4 tabular-nums text-text-muted">
                        {uploadFile.type || "unknown"} · {(uploadFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          // Return to the full upload panel without navigating away.
                          clearFileHandoffCache();
                          setUploadFile(null);
                        }}
                      >
                          Change
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title" className="font-semibold text-ink">Give your quiz a name</Label>
                    <Input
                      id="quiz-title"
                      type="text"
                      value={quizTitle}
                      maxLength={255}
                      placeholder="Cell Biology Midterm"
                      onChange={(event) => setQuizTitle(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave it blank and we will use the file name.</p>
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
          </motion.section>

          <motion.section
            aria-labelledby="room-settings-heading"
            className="editorial-create-room"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5">
              <h2 id="room-settings-heading" className="text-lg font-semibold text-ink">
                Room <span className="sr-only">Set up the room</span>
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Pick the pace and decide who can find it.</p>
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
          </motion.section>
          </div>

          <motion.div
            className="editorial-create-footer"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
          {mutation.error && (
            <p role="alert" className="rounded-[var(--radius-control)] bg-danger-soft px-4 py-3 text-sm font-semibold leading-5 text-danger-foreground">
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create game"}
            </p>
          )}

          <section aria-label="Create room action">
            <Button size="lg" className="w-full" disabled={!canLaunch || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Creating..." : "Create room"}
            </Button>
          </section>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
