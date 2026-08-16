import { createHash, randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendRawMail } from "@/server/services/mailer";

const Schema = z.object({ email: z.string().min(1) });
const OTP_TTL_MINUTES = 10;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter your email or USN." }, { status: 400 });
  }

  const input = parsed.data.email.trim();
  const inputLower = input.toLowerCase();

  // Find user by email OR student USN
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: inputLower },
        { student: { usn: input.toUpperCase() } },
        { student: { email: inputLower } },
      ],
    },
  });

  const ok = NextResponse.json({
    ok: true,
    message: "If that account is registered, an OTP has been sent.",
  });

  if (!user || !user.isActive) {
    // If not found, return ok so attackers cannot enumerate accounts
    return ok;
  }

  const targetEmail = user.email;

  // Invalidate all previous unused OTPs for this email+purpose
  await prisma.otpCode.updateMany({
    where: { email: targetEmail, purpose: "LOGIN", used: false },
    data: { used: true },
  });

  const code = String(randomInt(100000, 999999));
  await prisma.otpCode.create({
    data: {
      email: targetEmail,
      codeHash: hashCode(code),
      purpose: "LOGIN",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  try {
    writeFileSync(
      join(process.cwd(), ".latest-otp.json"),
      JSON.stringify({ email: targetEmail, code, purpose: "LOGIN", time: new Date().toISOString() }, null, 2),
    );
  } catch {}

  console.log(`\n========================================\n🔥 [LOGIN OTP FOR ${targetEmail}]: ${code}\n========================================\n`);

  await sendRawMail({
    to: targetEmail,
    subject: "Your Campus Here sign-in code",
    text:
      `Hello ${user.name},\n\n` +
      `Your one-time sign-in code for Campus Here is:\n\n` +
      `  ${code}\n\n` +
      `This code expires in ${OTP_TTL_MINUTES} minutes.\n` +
      `If you did not request this, you can ignore this email.\n`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#28265f">Campus Here — Sign-in OTP</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your one-time sign-in code is:</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.3em;color:#28265f;padding:20px;background:#f3f4f8;border-radius:12px;text-align:center;margin:20px 0">
          ${code}
        </div>
        <p style="color:#666">Expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.</p>
      </div>
    `,
  });

  return ok;
}
