import { prisma } from '../src/lib/prisma';

async function main() {
  const total = await prisma.student.count();
  console.log('Total students:', total);
  
  const sampleStudents = await prisma.student.findMany({
    take: 5,
    select: { usn: true, fullName: true, email: true, userId: true }
  });
  console.log('Sample students:', JSON.stringify(sampleStudents, null, 2));
}
main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
