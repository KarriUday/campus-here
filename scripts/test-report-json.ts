import { loadCorpusIndex } from '../src/server/services/titles';
import { checkTitle } from '../src/server/services/similarity';
import { prisma } from '../src/lib/prisma';

async function main() {
  const cycle = await prisma.projectCycle.findFirst({ where: { isActive: true } });
  if (!cycle) throw new Error('No cycle');

  const index = await loadCorpusIndex(cycle.id);
  const report = checkTitle('Cold-Chain Integrity Ledger for Vaccine Transport', index);

  console.log('Report JSON structure:');
  console.log(JSON.stringify(report, null, 2));
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
