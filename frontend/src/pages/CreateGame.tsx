import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

type CreationSource = "upload" | "past";

export default function CreateGame() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<CreationSource>("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
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

      if (!selectedQuiz) throw new Error("No quiz selected");
      const game = await createWaitingGame(token, {
        quizId: selectedQuiz.id,
        rounds: Math.min(questionCount, selectedQuiz.questionCount),
        maxPlayers,
        isPublic,
      });
      return { game, generation: null };
    },
    onSuccess: (data) => {
      navigate(`/game/lobby/${data.game.roomCode}`);

      if (data.generation) {
        const { token, file, count, title } = data.generation;
        void generateQuizForGame(
          token,
          data.game.gameId,
          file,
          count,
          title,
        ).catch(async (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to start quiz generation";
          await markWaitingQuizFailed(token, data.game.gameId, message).catch(
            () => {
              // Best-effort recovery; the original generation error is primary.
            },
          );
        });
      }
    },
  });

  const canLaunch =
    activeTab === "upload" ? uploadFile !== null : selectedQuiz !== null;
  const previewTitle =
    activeTab === "upload"
      ? quizTitle.trim() ||
        uploadFile?.name.replace(/\.(pdf|txt)$/i, "") ||
        null
      : (selectedQuiz?.title ?? null);
  const pastQuizCap = selectedQuiz?.questionCount ?? null;
  const previewQuestionCount =
    activeTab === "upload"
      ? questionCount
      : pastQuizCap != null
        ? Math.min(questionCount, pastQuizCap)
        : null;

  return (
    <PageShell maxWidth="6xl">
      <div className="mb-9 max-w-2xl">
        <nav
          aria-label="Quiz room actions"
          className="mb-7 flex w-fit gap-1 rounded-full border border-border bg-track p-1"
        >
          <span
            aria-current="page"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Create
          </span>
          <Link
            to="/game/join"
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Join
          </Link>
        </nav>

        <h1 className="text-balance font-display text-4xl font-extrabold text-ink sm:text-5xl">
          Build the quiz. Bring the room.
        </h1>
        <p className="mt-3 text-pretty text-base text-muted">
          Start from your notes or bring back a quiz your group already loves.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-(--radius-panel) border border-border bg-surface p-5 sm:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CreationSource)}
            >
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="upload" className="px-4">
                  Upload notes
                </TabsTrigger>
                <TabsTrigger value="past" className="px-4">
                  Past quizzes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-4">
                <UploadPanel
                  file={uploadFile}
                  onFileChange={setUploadFile}
                  title={quizTitle}
                  onTitleChange={setQuizTitle}
                />
              </TabsContent>
              <TabsContent value="past">
                <QuizPickerList
                  quizzes={quizzesQuery.data ?? []}
                  isLoading={quizzesQuery.isLoading}
                  selectedId={selectedQuiz?.id ?? null}
                  onSelect={(quiz) => {
                    setSelectedQuiz(quiz);
                    setQuestionCount(
                      Math.min(questionCount, quiz.questionCount),
                    );
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="rounded-(--radius-panel) border border-border bg-surface p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-xl font-extrabold text-ink">
                Set up the room
              </h2>
              <p className="mt-1 text-sm text-muted">
                Pick the pace and decide who can find it.
              </p>
            </div>
            <RoomSettings
              players={maxPlayers}
              onPlayersChange={setMaxPlayers}
              questions={questionCount}
              onQuestionsChange={setQuestionCount}
              isPublic={isPublic}
              onIsPublicChange={setIsPublic}
              maxQuestions={
                activeTab === "past" && pastQuizCap != null
                  ? pastQuizCap
                  : undefined
              }
            />
          </div>

          {mutation.error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Failed to create game"}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!canLaunch || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Launch lobby"}
          </Button>
        </div>

        <div className="lg:col-span-2">
          <RoomPreviewCard
            quizTitle={previewTitle}
            questionCount={previewQuestionCount}
            maxPlayers={maxPlayers}
            isPublic={isPublic}
          />
        </div>
      </div>
    </PageShell>
  );
}
