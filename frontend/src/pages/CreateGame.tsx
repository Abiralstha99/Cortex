import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import AppHeader from "@/components/AppHeader";
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
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [rounds, setRounds] = useState(10);

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
        if (rounds > questionCount) {
          throw new Error("Question count must cover every round");
        }

        const game = await createWaitingGame(token, { rounds });
        return {
          game,
          generation: { token, file: uploadFile, count: questionCount },
        };
      }

      if (!selectedQuiz) throw new Error("No quiz selected");
      const game = await createWaitingGame(token, {
        quizId: selectedQuiz.id,
        rounds: Math.min(rounds, selectedQuiz.questionCount),
      });
      return { game, generation: null };
    },
    onSuccess: (data) => {
      navigate(`/game/lobby/${data.game.roomCode}`);

      if (data.generation) {
        const { token, file, count } = data.generation;
        void generateQuizForGame(
          token,
          data.game.gameId,
          file,
          count,
        ).catch(async (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to start quiz generation";
          await markWaitingQuizFailed(
            token,
            data.game.gameId,
            message,
          ).catch(() => {
            // Best-effort recovery; the original generation error is primary.
          });
        });
      }
    },
  });

  const maxRounds =
    activeTab === "upload"
      ? Math.min(20, questionCount)
      : selectedQuiz
        ? Math.min(20, selectedQuiz.questionCount)
        : 20;
  const canLaunch =
    activeTab === "upload"
      ? uploadFile !== null
      : selectedQuiz !== null;
  const previewTitle =
    activeTab === "upload"
      ? (uploadFile?.name.replace(/\.(pdf|txt)$/i, "") ?? null)
      : (selectedQuiz?.title ?? null);
  const previewQuestionCount =
    activeTab === "upload"
      ? uploadFile
        ? questionCount
        : null
      : (selectedQuiz?.questionCount ?? null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: picker + settings */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CreationSource)}
            >
              <TabsList>
                <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                <TabsTrigger value="past">Past Quizzes</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <UploadPanel
                  file={uploadFile}
                  count={questionCount}
                  onFileChange={setUploadFile}
                  onCountChange={(count) => {
                    setQuestionCount(count);
                    setRounds((current) => Math.min(current, count));
                  }}
                />
              </TabsContent>
              <TabsContent value="past">
                <QuizPickerList
                  quizzes={quizzesQuery.data ?? []}
                  isLoading={quizzesQuery.isLoading}
                  selectedId={selectedQuiz?.id ?? null}
                  onSelect={setSelectedQuiz}
                />
              </TabsContent>
            </Tabs>

            <RoomSettings
              rounds={rounds}
              maxRounds={maxRounds}
              onRoundsChange={setRounds}
            />

            {mutation.error && (
              <p className="text-sm text-red-600">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Failed to create game"}
              </p>
            )}

            <Button
              variant="rose"
              size="lg"
              className="w-full"
              disabled={!canLaunch || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Creating…" : "Launch lobby →"}
            </Button>
          </div>

          {/* Right: preview */}
          <div className="lg:col-span-2">
            <RoomPreviewCard
              quizTitle={previewTitle}
              questionCount={previewQuestionCount}
              rounds={rounds}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
