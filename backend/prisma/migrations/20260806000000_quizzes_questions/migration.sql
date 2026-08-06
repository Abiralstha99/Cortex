-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('pdf', 'text');

-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_country_id_fkey";

-- DropIndex
DROP INDEX "answers_country_id_idx";

-- DropIndex
DROP INDEX "answers_game_id_user_id_country_id_key";

-- AlterTable answers: replace country_id/answer with question_id/answer_index
ALTER TABLE "answers" DROP COLUMN "answer",
DROP COLUMN "country_id",
ADD COLUMN "answer_index" INTEGER NOT NULL,
ADD COLUMN "question_id" UUID NOT NULL;

-- CreateTable quizzes
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "question_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable questions
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- AlterTable games: replace difficulty with quiz_id
ALTER TABLE "games" DROP COLUMN "difficulty",
ADD COLUMN "quiz_id" UUID NOT NULL;

-- DropTable countries
DROP TABLE "countries";

-- DropEnum Difficulty
DROP TYPE "Difficulty";

-- CreateIndex
CREATE INDEX "quizzes_owner_id_idx" ON "quizzes"("owner_id");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_quiz_id_position_key" ON "questions"("quiz_id", "position");

-- CreateIndex
CREATE INDEX "games_quiz_id_idx" ON "games"("quiz_id");

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "answers_game_id_user_id_question_id_key" ON "answers"("game_id", "user_id", "question_id");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
