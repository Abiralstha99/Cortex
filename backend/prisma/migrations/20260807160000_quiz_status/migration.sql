-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "status" "QuizStatus" NOT NULL DEFAULT 'ready';

-- CreateIndex
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");
