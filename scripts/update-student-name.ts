import { prisma } from '../src/lib/prisma';

async function main() {
  const student = await prisma.student.findUnique({
    where: { usn: '1BY23CS098' },
    include: { user: true },
  });

  if (!student) {
    console.error('Student with USN 1BY23CS098 not found');
    return;
  }

  // Update student full name
  await prisma.student.update({
    where: { id: student.id },
    data: { fullName: 'Karri Uday' },
  });

  // Update user name if exists
  if (student.user) {
    await prisma.user.update({
      where: { id: student.user.id },
      data: { name: 'Karri Uday' },
    });
  }

  console.log('Successfully updated USN 1BY23CS098 name to "Karri Uday"!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
