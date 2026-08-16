import { prisma } from '../src/lib/prisma';
import { calculateRubricTotal } from '../src/lib/evaluation-rubrics';

async function main() {
  console.log('--- Testing Review & Evaluation System ---');

  // Find a review session in the active cycle
  const session = await prisma.reviewSession.findFirst({
    include: {
      group: {
        include: {
          members: { select: { studentId: true } },
          title: true,
        },
      },
      faculty: true,
    },
  });

  if (!session) {
    console.error('No review session found in database. Please run reviews generator or seed first.');
    return;
  }

  console.log(`Testing with Session ID: ${session.id} | Group: ${session.group.code} | Phase: ${session.phase}`);

  const rubricScores = {
    problem_definition: 2.25,
    literature_survey: 2.5,
    methodology_scope: 2.0,
    presentation_qa: 2.25,
  };

  const computedTotal = calculateRubricTotal(session.phase, rubricScores);
  console.log(`Calculated Rubric Total: ${computedTotal} / 10.0`);

  // Upsert evaluation
  const evaluation = await prisma.evaluation.upsert({
    where: {
      sessionId_groupId: { sessionId: session.id, groupId: session.groupId },
    },
    create: {
      sessionId: session.id,
      groupId: session.groupId,
      facultyId: session.facultyId ?? session.group.members[0].studentId,
      score: computedTotal,
      remarks: 'Exemplary topic defense. Strong literature review of recent IEEE publications.',
      rubricScores,
      verdict: 'EXCELLENT',
      actionItems: '1. Prepare data preprocessing pipeline.\n2. Finalize UML architecture specifications for Phase 1.',
    },
    update: {
      score: computedTotal,
      remarks: 'Exemplary topic defense. Strong literature review of recent IEEE publications.',
      rubricScores,
      verdict: 'EXCELLENT',
      actionItems: '1. Prepare data preprocessing pipeline.\n2. Finalize UML architecture specifications for Phase 1.',
    },
  });

  // Add individual student scores
  for (const member of session.group.members) {
    await prisma.studentScore.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evaluation.id,
          studentId: member.studentId,
        },
      },
      create: {
        evaluationId: evaluation.id,
        studentId: member.studentId,
        score: computedTotal,
        remarks: 'Active participant in technical Q&A',
      },
      update: {
        score: computedTotal,
        remarks: 'Active participant in technical Q&A',
      },
    });
  }

  console.log('✅ Evaluation with Rubrics & Student Scores successfully written to PostgreSQL!');
  console.log('Evaluation Record:', JSON.stringify(evaluation, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
