ALTER TABLE "answers" RENAME COLUMN "answer_index" TO "response";
ALTER TABLE "answers"
  ALTER COLUMN "response" TYPE JSONB
  USING to_jsonb("response");

ALTER TABLE "games" DROP CONSTRAINT "games_winner_id_fkey";
DROP INDEX "games_winner_id_idx";
ALTER TABLE "games" DROP COLUMN "winner_id";
