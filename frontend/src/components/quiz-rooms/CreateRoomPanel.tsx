import type { QuizSummary } from "@/lib/api";
import QuizPickerList from "@/components/quiz-rooms/QuizPickerList";
import RoomSettings from "@/components/quiz-rooms/RoomSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateRoomPanelProps {
  quizzes: QuizSummary[];
  isLoading: boolean;
  selectedQuiz: QuizSummary | null;
  onSelectQuiz: (quiz: QuizSummary) => void;
  maxPlayers: number;
  onPlayersChange: (n: number) => void;
  questions: number;
  onQuestionsChange: (n: number) => void;
}

export default function CreateRoomPanel({
  quizzes,
  isLoading,
  selectedQuiz,
  onSelectQuiz,
  maxPlayers,
  onPlayersChange,
  questions,
  onQuestionsChange,
}: CreateRoomPanelProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="past">
        <TabsList>
          <TabsTrigger value="past">Past Quizzes</TabsTrigger>
          <TabsTrigger value="upload">Upload PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="past">
          <QuizPickerList
            quizzes={quizzes}
            isLoading={isLoading}
            selectedId={selectedQuiz?.id ?? null}
            onSelect={onSelectQuiz}
          />
        </TabsContent>
        <TabsContent value="upload">
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
            <p>Upload PDF panel coming soon…</p>
          </div>
        </TabsContent>
      </Tabs>

      <RoomSettings
        players={maxPlayers}
        onPlayersChange={onPlayersChange}
        questions={questions}
        onQuestionsChange={onQuestionsChange}
        maxQuestions={selectedQuiz?.questionCount}
      />
    </div>
  );
}
