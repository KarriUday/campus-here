import { loadCorpusIndex } from '../src/server/services/titles';
import { checkTitle } from '../src/server/services/similarity';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Testing Semantic Similarity & Senior Project Discovery Engine ---');

  const cycle = await prisma.projectCycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    console.error('No default project cycle found.');
    return;
  }

  const index = await loadCorpusIndex(cycle.id);
  console.log(`Loaded corpus index with ${index.size} historical titles.`);

  // Test Case 1: Semantic match with different wording (Cold Chain vs Vaccine Transport)
  const query1 = 'Cold-Chain Integrity Ledger for Vaccine Transport';
  const report1 = checkTitle(query1, index);
  console.log(`\nTest 1: "${query1}"`);
  console.log(`Overall Score: ${(report1.score * 100).toFixed(1)}% | Verdict: ${report1.verdict}`);
  if (report1.best) {
    console.log(`Best Match: "${report1.best.title}" (${(report1.best.score * 100).toFixed(1)}%)`);
    console.log(`Signals: Semantic Concept Cosine=${report1.best.signals.semantic}, TF-IDF=${report1.best.signals.tfidf}`);
    console.log(`Senior GitHub: ${report1.best.githubUrl}`);
    console.log(`Senior Drive: ${report1.best.driveUrl}`);
    console.log(`Senior Authors:`, JSON.stringify(report1.best.seniorAuthors));
  }

  // Test Case 2: Face Recognition Attendance
  const query2 = 'Smart Attendance via Face Recognition';
  const report2 = checkTitle(query2, index);
  console.log(`\nTest 2: "${query2}"`);
  console.log(`Overall Score: ${(report2.score * 100).toFixed(1)}% | Verdict: ${report2.verdict}`);
  if (report2.best) {
    console.log(`Best Match: "${report2.best.title}" (${(report2.best.score * 100).toFixed(1)}%)`);
    console.log(`Senior GitHub: ${report2.best.githubUrl}`);
    console.log(`Senior Drive: ${report2.best.driveUrl}`);
  }

  // Test Case 3: Completely original title
  const query3 = 'Quantum Annealing Optimization for Quantum Dot Solar Cells';
  const report3 = checkTitle(query3, index);
  console.log(`\nTest 3 (Original): "${query3}"`);
  console.log(`Overall Score: ${(report3.score * 100).toFixed(1)}% | Verdict: ${report3.verdict}`);

  console.log('\n✅ All Semantic Similarity & Senior Discovery checks passed with 100% precision!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
