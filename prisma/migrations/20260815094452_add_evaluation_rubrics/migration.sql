-- CreateEnum
CREATE TYPE "ReviewVerdict" AS ENUM ('APPROVED', 'NEEDS_REVISION', 'EXCELLENT', 'REJECTED');

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "actionItems" TEXT,
ADD COLUMN     "rubricScores" JSONB,
ADD COLUMN     "verdict" "ReviewVerdict" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "StudentScore" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DECIMAL(4,2) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "StudentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentScore_studentId_idx" ON "StudentScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_evaluationId_studentId_key" ON "StudentScore"("evaluationId", "studentId");

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
