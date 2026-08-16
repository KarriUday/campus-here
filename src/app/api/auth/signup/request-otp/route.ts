import { createHash, randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendRawMail } from "@/server/services/mailer";

const Schema = z.object({
  email: z.string().email(),
  usn: z.string().min(3).max(20),
});

const OTP_TTL_MINUTES = 10;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch((err) => { console.error('JSON parse error:', err); return null; });
  console.log('REQUEST BODY RECEIVED:', body);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    console.error('SCHEMA PARSE ERROR:', parsed.error);
    return NextResponse.json({ error: "Please enter a valid email and USN." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const usn = parsed.data.usn.trim().toUpperCase();

  // Find the student by USN
  const student = await prisma.student.findUnique({
    where: { usn },
    include: { user: true },
  });

  const studentName = student?.fullName ?? "Student";

  // Invalidate all previous unused OTPs for this email+purpose
  await prisma.otpCode.updateMany({
    where: { email, purpose: "SIGNUP", used: false },
    data: { used: true },
  });

  // Generate and store a new OTP
  const code = String(randomInt(100000, 999999));
  await prisma.otpCode.create({
    data: {
      email,
      codeHash: hashCode(code),
      purpose: "SIGNUP",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  // Write to temporary local file so it can be checked immediately
  try {
    writeFileSync(
      join(process.cwd(), ".latest-otp.json"),
      JSON.stringify({ email, usn, code, purpose: "SIGNUP", time: new Date().toISOString() }, null, 2),
    );
  } catch {}

  console.log(`\n========================================\n🔥 [SIGNUP OTP FOR ${email} (${usn})]: ${code}\n========================================\n`);

  // Send OTP email (or dry-run log)
  await sendRawMail({
    to: email,
    subject: "Your Campus Here signup code",
    text:
      `Hello ${studentName},\n\n` +
      `Your one-time signup code for Campus Here is:\n\n` +
      `  ${code}\n\n` +
      `This code expires in ${OTP_TTL_MINUTES} minutes.\n` +
      `If you did not request this, you can ignore this email.\n`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#28265f">Campus Here — Signup OTP</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your one-time signup code is:</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.3em;color:#28265f;padding:20px;background:#f3f4f8;border-radius:12px;text-align:center;margin:20px 0">
          ${code}
        </div>
        <p style="color:#666">Expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.</p>
      </div>
    `,
  });

  return NextResponse.json({
    ok: true,
    message: "OTP sent successfully.",
  });
}
