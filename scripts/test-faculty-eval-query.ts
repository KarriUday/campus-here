import { prisma } from '../src/lib/prisma';

async function main() {
  const faculty = await prisma.faculty.findFirst();
  if (!faculty) {
    console.log('No faculty found');
    return;
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { facultyId: faculty.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      group: {
        select: {
          id: true,
          code: true,
          title: { select: { title: true } },
          members: {
            select: {
              student: {
                select: { id: true, usn: true, fullName: true, email: true },
              },
            },
          },
        },
      },
      session: { select: { id: true, phase: true, scheduledAt: true, venue: true } },
      studentScores: {
        include: {
          student: { select: { id: true, usn: true, fullName: true } },
        },
      },
    },
  });

  console.log(`Evaluations found: ${evaluations.length}`);
  console.log('First eval sample:', JSON.stringify(evaluations[0], null, 2));
}

main().then(() => process.exit(0)).catch((err) => { console.error('Query Error:', err); process.exit(1); });
