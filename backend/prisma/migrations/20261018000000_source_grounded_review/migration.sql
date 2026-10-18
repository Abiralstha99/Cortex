CREATE TABLE "source_chunks" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "chunk_id" VARCHAR(32) NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "source_chunks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_sources" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "source_chunk_id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    CONSTRAINT "question_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_rounds" (
    "game_id" UUID NOT NULL,
    "round_number" INTEGER NOT NULL,
    "question_id" UUID NOT NULL,
    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("game_id","round_number")
);

CREATE UNIQUE INDEX "source_chunks_quiz_id_chunk_id_key" ON "source_chunks"("quiz_id","chunk_id");
CREATE UNIQUE INDEX "question_sources_question_id_source_chunk_id_quote_key" ON "question_sources"("question_id","source_chunk_id","quote");

ALTER TABLE "source_chunks" ADD CONSTRAINT "source_chunks_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_source_chunk_id_fkey" FOREIGN KEY ("source_chunk_id") REFERENCES "source_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
