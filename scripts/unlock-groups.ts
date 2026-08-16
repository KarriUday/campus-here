import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Unlocking Groups in Active Project Cycle ---');

  const unlocked = await prisma.group.updateMany({
    data: {
      lockedAt: null,
    },
  });

  console.log(`✅ Unlocked ${unlocked.count} groups! Students can now freely edit domain, title, and problem statements.`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
