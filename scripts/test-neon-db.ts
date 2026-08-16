import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing connection to Neon PostgreSQL...');
  const start = Date.now();
  const count = await prisma.user.count();
  const elapsed = Date.now() - start;
  console.log(`Connected successfully in ${elapsed}ms! User count in Neon DB: ${count}`);
}

main().then(() => process.exit(0)).catch(err => { console.error('Connection error:', err); process.exit(1); });
