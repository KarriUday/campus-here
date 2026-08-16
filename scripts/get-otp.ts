import { prisma } from '../src/lib/prisma';
import { createHash } from 'node:crypto';

async function main() {
  const latest = await prisma.otpCode.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!latest) {
    console.log('NO_OTP_FOUND');
    return;
  }
  console.log('EMAIL:', latest.email);
  for (let i = 100000; i <= 999999; i++) {
    const code = String(i);
    const hash = createHash('sha256').update(code).digest('hex');
    if (hash === latest.codeHash) {
      console.log('OTP_CODE:' + code);
      break;
    }
  }
}
main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
