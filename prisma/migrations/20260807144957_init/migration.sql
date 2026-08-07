-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT', 'FACULTY');

-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('FORMING', 'READY', 'SUBMITTED', 'ALLOCATED');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TitleSource" AS ENUM ('IMPORTED_CORPUS', 'STUDENT_SUBMISSION');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('GALE_SHAPLEY', 'MANUAL');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ALLOCATED', 'UNALLOCATED');

-- CreateEnum
CREATE TYPE "UnallocatedReason" AS ENUM ('ALL_PREFERENCES_FULL', 'INVALID_PREFERENCES', 'NO_PREFERENCES', 'NOT_SUBMITTED');

-- CreateEnum
CREATE TYPE "ReviewPhase" AS ENUM ('R0', 'P1', 'P2');

-- CreateEnum
CREATE TYPE "CalendarPhase" AS ENUM ('R0', 'P1', 'P2', 'REVIEW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "OrientationType" AS ENUM ('TEXT', 'AUDIO');

-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('REVIEW_15_DAY', 'REVIEW_7_DAY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('QUEUED', 'DUE', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('LIVE', 'DRY_RUN');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'DRY_RUN');

-- CreateEnum
CREATE TYPE "ImportEntity" AS ENUM ('STUDENTS', 'FACULTY', 'TITLES');

-- CreateEnum
CREATE TYPE "DetectionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('STUDENT_CSV', 'FACULTY_CSV', 'TITLE_CSV', 'CALENDAR_PDF', 'ORIENTATION_AUDIO', 'EMAIL_ATTACHMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "resetTokenHash" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usn" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cgpa" DECIMAL(4,2) NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCycle" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" "Designation" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "smtpUserEnc" TEXT,
    "smtpPassEnc" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCycle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "groupSize" INTEGER NOT NULL DEFAULT 4,
    "prefCount" INTEGER NOT NULL DEFAULT 6,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacityRule" (
    "id" TEXT NOT NULL,
    "designation" "Designation" NOT NULL,
    "maxGroups" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'FORMING',
    "domainId" TEXT,
    "leaderId" TEXT NOT NULL,
    "avgCgpa" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "prefsSubmittedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInvite" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "fromStudentId" TEXT NOT NULL,
    "toStudentId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTitle" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "groupId" TEXT,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "problemStatement" TEXT,
    "domainId" TEXT,
    "domainLabel" TEXT,
    "guideLabel" TEXT,
    "groupLabel" TEXT,
    "cycleLabel" TEXT,
    "source" "TitleSource" NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "similarityScore" DECIMAL(5,4),
    "similarityReport" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidePreference" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuidePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "facultyId" TEXT,
    "matchedRank" INTEGER,
    "method" "AllocationMethod" NOT NULL DEFAULT 'GALE_SHAPLEY',
    "status" "AllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
    "unallocatedReason" "UnallocatedReason",
    "runId" TEXT,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationRun" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "triggeredById" TEXT NOT NULL,
    "isDryRun" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "groupsConsidered" INTEGER NOT NULL DEFAULT 0,
    "facultyConsidered" INTEGER NOT NULL DEFAULT 0,
    "allocatedCount" INTEGER NOT NULL DEFAULT 0,
    "unallocatedCount" INTEGER NOT NULL DEFAULT 0,
    "params" JSONB,

    CONSTRAINT "AllocationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSession" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "facultyId" TEXT,
    "phase" "ReviewPhase" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 20,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "score" DECIMAL(4,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orientation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "type" "OrientationType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "postedByLabel" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "text" TEXT,
    "audioFileId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orientation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarImport" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "fileId" TEXT,
    "filename" TEXT NOT NULL,
    "extractedChars" INTEGER NOT NULL DEFAULT 0,
    "detectedEvents" INTEGER NOT NULL DEFAULT 0,
    "rawText" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "importId" TEXT,
    "title" TEXT NOT NULL,
    "phase" "CalendarPhase" NOT NULL,
    "eventDate" DATE NOT NULL,
    "confidence" "DetectionConfidence" NOT NULL,
    "sourceLine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "eventId" TEXT,
    "kind" "ReminderKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "reminderId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "mode" "DeliveryMode" NOT NULL DEFAULT 'DRY_RUN',
    "smtpMode" TEXT,
    "error" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "studentId" TEXT,
    "cycleId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "usn" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "previewUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "twilioSid" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "mode" "DeliveryMode" NOT NULL DEFAULT 'DRY_RUN',
    "error" TEXT,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "kind" "FileKind" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "entity" "ImportEntity" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CSV',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "fileId" TEXT,
    "appliedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DomainToFaculty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DomainToFaculty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_usn_key" ON "Student"("usn");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_cgpa_idx" ON "Student"("cgpa");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");

-- CreateIndex
CREATE INDEX "StudentCycle_cycleId_idx" ON "StudentCycle"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCycle_studentId_cycleId_key" ON "StudentCycle"("studentId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_userId_key" ON "Faculty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employeeId_key" ON "Faculty"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE INDEX "Faculty_designation_idx" ON "Faculty"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCycle_code_key" ON "ProjectCycle"("code");

-- CreateIndex
CREATE INDEX "ProjectCycle_isActive_idx" ON "ProjectCycle"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_slug_key" ON "Domain"("slug");

-- CreateIndex
CREATE INDEX "Domain_isActive_sortOrder_idx" ON "Domain"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CapacityRule_designation_key" ON "CapacityRule"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- CreateIndex
CREATE INDEX "Group_cycleId_status_idx" ON "Group"("cycleId", "status");

-- CreateIndex
CREATE INDEX "Group_cycleId_avgCgpa_idx" ON "Group"("cycleId", "avgCgpa");

-- CreateIndex
CREATE INDEX "GroupMember_studentId_idx" ON "GroupMember"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_studentId_key" ON "GroupMember"("groupId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_cycleId_studentId_key" ON "GroupMember"("cycleId", "studentId");

-- CreateIndex
CREATE INDEX "GroupInvite_toStudentId_status_idx" ON "GroupInvite"("toStudentId", "status");

-- CreateIndex
CREATE INDEX "GroupInvite_cycleId_status_idx" ON "GroupInvite"("cycleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvite_groupId_toStudentId_key" ON "GroupInvite"("groupId", "toStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTitle_groupId_key" ON "ProjectTitle"("groupId");

-- CreateIndex
CREATE INDEX "ProjectTitle_cycleId_source_idx" ON "ProjectTitle"("cycleId", "source");

-- CreateIndex
CREATE INDEX "ProjectTitle_cycleId_approvalStatus_idx" ON "ProjectTitle"("cycleId", "approvalStatus");

-- CreateIndex
CREATE INDEX "GuidePreference_facultyId_idx" ON "GuidePreference"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "GuidePreference_groupId_rank_key" ON "GuidePreference"("groupId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "GuidePreference_groupId_facultyId_key" ON "GuidePreference"("groupId", "facultyId");

-- CreateIndex
CREATE INDEX "Allocation_facultyId_idx" ON "Allocation"("facultyId");

-- CreateIndex
CREATE INDEX "Allocation_cycleId_status_idx" ON "Allocation"("cycleId", "status");

-- CreateIndex
CREATE INDEX "Allocation_runId_idx" ON "Allocation"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_groupId_key" ON "Allocation"("groupId");

-- CreateIndex
CREATE INDEX "AllocationRun_cycleId_startedAt_idx" ON "AllocationRun"("cycleId", "startedAt");

-- CreateIndex
CREATE INDEX "ReviewSession_cycleId_scheduledAt_idx" ON "ReviewSession"("cycleId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ReviewSession_facultyId_scheduledAt_idx" ON "ReviewSession"("facultyId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSession_groupId_phase_key" ON "ReviewSession"("groupId", "phase");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_studentId_key" ON "Attendance"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "Evaluation_groupId_idx" ON "Evaluation"("groupId");

-- CreateIndex
CREATE INDEX "Evaluation_facultyId_idx" ON "Evaluation"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_sessionId_groupId_key" ON "Evaluation"("sessionId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Orientation_audioFileId_key" ON "Orientation"("audioFileId");

-- CreateIndex
CREATE INDEX "Orientation_cycleId_createdAt_idx" ON "Orientation"("cycleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarImport_fileId_key" ON "CalendarImport"("fileId");

-- CreateIndex
CREATE INDEX "CalendarImport_cycleId_createdAt_idx" ON "CalendarImport"("cycleId", "createdAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_cycleId_eventDate_idx" ON "CalendarEvent"("cycleId", "eventDate");

-- CreateIndex
CREATE INDEX "Reminder_cycleId_status_dueAt_idx" ON "Reminder"("cycleId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_eventId_kind_key" ON "Reminder"("eventId", "kind");

-- CreateIndex
CREATE INDEX "EmailMessage_cycleId_createdAt_idx" ON "EmailMessage"("cycleId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_studentId_createdAt_idx" ON "Notification"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_toEmail_createdAt_idx" ON "Notification"("toEmail", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_cycleId_createdAt_idx" ON "Notification"("cycleId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_cycleId_createdAt_idx" ON "WhatsAppMessage"("cycleId", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedFile_kind_createdAt_idx" ON "UploadedFile"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_fileId_key" ON "ImportBatch"("fileId");

-- CreateIndex
CREATE INDEX "ImportBatch_cycleId_entity_createdAt_idx" ON "ImportBatch"("cycleId", "entity", "createdAt");

-- CreateIndex
CREATE INDEX "_DomainToFaculty_B_index" ON "_DomainToFaculty"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCycle" ADD CONSTRAINT "StudentCycle_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCycle" ADD CONSTRAINT "StudentCycle_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_fromStudentId_fkey" FOREIGN KEY ("fromStudentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_toStudentId_fkey" FOREIGN KEY ("toStudentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTitle" ADD CONSTRAINT "ProjectTitle_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTitle" ADD CONSTRAINT "ProjectTitle_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTitle" ADD CONSTRAINT "ProjectTitle_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTitle" ADD CONSTRAINT "ProjectTitle_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidePreference" ADD CONSTRAINT "GuidePreference_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidePreference" ADD CONSTRAINT "GuidePreference_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AllocationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationRun" ADD CONSTRAINT "AllocationRun_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationRun" ADD CONSTRAINT "AllocationRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orientation" ADD CONSTRAINT "Orientation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orientation" ADD CONSTRAINT "Orientation_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orientation" ADD CONSTRAINT "Orientation_audioFileId_fkey" FOREIGN KEY ("audioFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarImport" ADD CONSTRAINT "CalendarImport_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarImport" ADD CONSTRAINT "CalendarImport_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarImport" ADD CONSTRAINT "CalendarImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_importId_fkey" FOREIGN KEY ("importId") REFERENCES "CalendarImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ProjectCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainToFaculty" ADD CONSTRAINT "_DomainToFaculty_A_fkey" FOREIGN KEY ("A") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainToFaculty" ADD CONSTRAINT "_DomainToFaculty_B_fkey" FOREIGN KEY ("B") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
