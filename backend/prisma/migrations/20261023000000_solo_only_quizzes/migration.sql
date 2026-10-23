CREATE TYPE "QuizClassification" AS ENUM ('MULTIPLAYER', 'SOLO_ONLY');
ALTER TABLE "quizzes" ADD COLUMN "classification" "QuizClassification" NOT NULL DEFAULT 'MULTIPLAYER';
