-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "approvalStatus" "AccountStatus" NOT NULL DEFAULT 'APPROVED';
