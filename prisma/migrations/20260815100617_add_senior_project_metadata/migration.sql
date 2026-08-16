-- AlterTable
ALTER TABLE "ProjectTitle" ADD COLUMN     "driveUrl" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "isExtension" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectAbstract" TEXT,
ADD COLUMN     "proposedInnovations" TEXT,
ADD COLUMN     "seniorAuthors" JSONB,
ADD COLUMN     "seniorReferenceId" TEXT;
