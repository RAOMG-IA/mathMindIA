-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('Primaria', 'Secundaria', 'Bachillerato', 'Ingenieria');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('Test', 'Resolution');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('ai-batch', 'manual');

-- CreateEnum
CREATE TYPE "RagIngestionStatus" AS ENUM ('processed', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "academic_level" "AcademicLevel" NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "score_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_ratings" (
    "user_id" TEXT NOT NULL,
    "academic_level" "AcademicLevel" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "user_ratings_pkey" PRIMARY KEY ("user_id","academic_level")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "academic_level" "AcademicLevel" NOT NULL,
    "topic" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer" TEXT NOT NULL,
    "difficulty_value" DOUBLE PRECISION NOT NULL,
    "time_limit_ms" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "generated_by" "GeneratedBy" NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" "ExerciseType" NOT NULL,
    "academic_level" "AcademicLevel" NOT NULL,
    "topic" TEXT NOT NULL,
    "rating_at_start" DOUBLE PRECISION NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "submitted_value" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "hint_order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_ingestion_records" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "status" "RagIngestionStatus" NOT NULL,
    "error_message" TEXT,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_ingestion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "source_file_name" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "exercises_academic_level_topic_difficulty_value_idx" ON "exercises"("academic_level", "topic", "difficulty_value");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "answers_session_id_idx" ON "answers"("session_id");

-- CreateIndex
CREATE INDEX "answers_user_id_idx" ON "answers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hints_exercise_id_hint_order_key" ON "hints"("exercise_id", "hint_order");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
