-- Existing quiz questions use an incompatible shape. Remove only quiz-owned
-- durable records, in foreign-key order; keep users and their account data.
DELETE FROM "answers" WHERE "game_id" IN (SELECT "id" FROM "games" WHERE "quiz_id" IN (SELECT "id" FROM "quizzes"));
DELETE FROM "game_players" WHERE "game_id" IN (SELECT "id" FROM "games" WHERE "quiz_id" IN (SELECT "id" FROM "quizzes"));
DELETE FROM "games" WHERE "quiz_id" IN (SELECT "id" FROM "quizzes");
DELETE FROM "questions" WHERE "quiz_id" IN (SELECT "id" FROM "quizzes");
DELETE FROM "quizzes";

CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'FILL_BLANK');
ALTER TABLE "questions" RENAME COLUMN "question" TO "question_text";
ALTER TABLE "questions" DROP COLUMN "options", DROP COLUMN "correct_index";
ALTER TABLE "questions" ADD COLUMN "type" "QuestionType" NOT NULL, ADD COLUMN "content" JSONB NOT NULL;
