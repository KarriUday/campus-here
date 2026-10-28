import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { getStudentsFromExcel } from "./parse-excel-students";

async function main() {
  console.log("=== Starting Excel Students Sync & Mock Data Cleanup ===");

  // 1. Get real students from Excel
  const excelStudents = await getStudentsFromExcel();
  console.log(`Found ${excelStudents.length} real students in Excel files.`);
  const realUsnSet = new Set(excelStudents.map((s) => s.usn.toUpperCase()));

  // 2. Find active cycle
  const activeCycle =
    (await prisma.projectCycle.findFirst({
      where: { isActive: true },
    })) ||
    (await prisma.projectCycle.findFirst({
      orderBy: { createdAt: "desc" },
    }));

  if (!activeCycle) {
    throw new Error("No ProjectCycle found in database.");
  }
  console.log(`Target ProjectCycle: ${activeCycle.name} (${activeCycle.code})`);

  // 3. Find mock students currently in database
  const allDbStudents = await prisma.student.findMany({
    select: { id: true, usn: true, userId: true },
  });

  const mockStudents = allDbStudents.filter(
    (s) =>
      !realUsnSet.has(s.usn.toUpperCase()) &&
      s.usn.toUpperCase() !== "1BY23CS098"
  );
  console.log(`Identified ${mockStudents.length} mock students to remove.`);

  const mockStudentIds = mockStudents.map((s) => s.id);
  const mockUserIds = mockStudents
    .map((s) => s.userId)
    .filter(Boolean) as string[];

  if (mockStudentIds.length > 0) {
    console.log("Cleaning up mock student relations...");

    // Remove student scores
    await prisma.studentScore.deleteMany({
      where: { studentId: { in: mockStudentIds } },
    });

    // Remove attendance
    await prisma.attendance.deleteMany({
      where: { studentId: { in: mockStudentIds } },
    });

    // Remove invites
    await prisma.groupInvite.deleteMany({
      where: {
        OR: [
          { toStudentId: { in: mockStudentIds } },
          { fromStudentId: { in: mockStudentIds } },
        ],
      },
    });

    // Remove notifications
    await prisma.notification.deleteMany({
      where: { studentId: { in: mockStudentIds } },
    });

    // Find groups led by mock students
    const mockGroups = await prisma.group.findMany({
      where: { leaderId: { in: mockStudentIds } },
      select: { id: true },
    });
    const mockGroupIds = mockGroups.map((g) => g.id);

    if (mockGroupIds.length > 0) {
      await prisma.evaluation.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.reviewSession.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.allocation.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.guidePreference.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.projectTitle.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.groupInvite.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.groupMember.deleteMany({
        where: { groupId: { in: mockGroupIds } },
      });
      await prisma.group.deleteMany({
        where: { id: { in: mockGroupIds } },
      });
    }

    // Remove group memberships for mock students
    await prisma.groupMember.deleteMany({
      where: { studentId: { in: mockStudentIds } },
    });

    // Remove student cycles
    await prisma.studentCycle.deleteMany({
      where: { studentId: { in: mockStudentIds } },
    });

    // Remove mock students
    await prisma.student.deleteMany({
      where: { id: { in: mockStudentIds } },
    });

    // Remove mock user accounts (only where role is STUDENT)
    await prisma.user.deleteMany({
      where: {
        id: { in: mockUserIds },
        role: "STUDENT",
      },
    });

    console.log("Mock students and their associated dummy data purged successfully.");
  }

  // 4. Upsert the real students from Excel
  const defaultPasswordHash = await bcrypt.hash("bmsit123", 10);
  let upsertedCount = 0;

  for (const s of excelStudents) {
    const studentEmail = `${s.usn.toLowerCase()}@bmsit.in`;

    // Upsert User
    const user = await prisma.user.upsert({
      where: { email: studentEmail },
      update: {
        name: s.name,
        role: s.usn === "1BY23CS098" ? "ADMIN" : "STUDENT",
        passwordHash: defaultPasswordHash,
        isActive: true,
        approvalStatus: "APPROVED",
      },
      create: {
        email: studentEmail,
        name: s.name,
        role: s.usn === "1BY23CS098" ? "ADMIN" : "STUDENT",
        passwordHash: defaultPasswordHash,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    // Upsert Student
    const student = await prisma.student.upsert({
      where: { usn: s.usn },
      update: {
        fullName: s.name,
        email: studentEmail,
        phone: s.phone || null,
        userId: user.id,
      },
      create: {
        usn: s.usn,
        fullName: s.name,
        email: studentEmail,
        phone: s.phone || null,
        cgpa: 8.5,
        userId: user.id,
      },
    });

    // Ensure Enrollment in active cycle
    const existingEnrollment = await prisma.studentCycle.findFirst({
      where: {
        studentId: student.id,
        cycleId: activeCycle.id,
      },
    });

    if (!existingEnrollment) {
      await prisma.studentCycle.create({
        data: {
          studentId: student.id,
          cycleId: activeCycle.id,
        },
      });
    }

    upsertedCount++;
  }

  console.log(`Upserted ${upsertedCount} real students into database.`);

  // 5. Final counts verification
  const totalStudents = await prisma.student.count();
  const totalStudentUsers = await prisma.user.count({ where: { role: "STUDENT" } });
  const totalFaculty = await prisma.faculty.count();
  const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });

  console.log("=== Sync Summary ===");
  console.log(`Real Students in DB: ${totalStudents}`);
  console.log(`Student Users in DB: ${totalStudentUsers}`);
  console.log(`Cluster-1 Faculty: ${totalFaculty}`);
  console.log(`Admins: ${totalAdmins}`);
}

main()
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
