CREATE TYPE "PracticeStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

CREATE TABLE "practice_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "quiz_id" UUID NOT NULL,
  "status" "PracticeStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "question_order" JSONB NOT NULL,
  "score" INTEGER,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "practice_sessions_user_id_quiz_id_completed_at_idx" ON "practice_sessions"("user_id", "quiz_id", "completed_at");
CREATE UNIQUE INDEX "practice_sessions_one_in_progress_idx" ON "practice_sessions"("user_id", "quiz_id") WHERE "status" = 'IN_PROGRESS';
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "practice_answers" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "submitted_answer" JSONB NOT NULL,
  "is_correct" BOOLEAN,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "practice_answers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "practice_answers_session_id_question_id_key" ON "practice_answers"("session_id", "question_id");
CREATE INDEX "practice_answers_question_id_idx" ON "practice_answers"("question_id");
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
