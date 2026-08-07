import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendRawMail } from "@/server/services/mailer";

const ForgotSchema = z.object({ email: z.email() });

/** Reset links are short-lived. */
const TOKEN_TTL_MINUTES = 30;

export async function POST(request: Request) {
  const parsed = ForgotSchema.safeParse(await request.json().catch(() => null));

  // Always answer the same way, whether or not the address exists — otherwise
  // this endpoint becomes an account-enumeration oracle.
  const ok = NextResponse.json({
    ok: true,
    message:
      "If that email is registered, a reset link has been sent to it.",
  });

  if (!parsed.success) return ok;

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return ok;

  // Only the hash is stored: a leaked database row cannot be replayed as a
  // reset link.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/reset-password?token=${token}`;

  await sendRawMail({
    to: user.email,
    subject: "Reset your Campus Here password",
    text:
      `Hello ${user.name},\n\n` +
      `A password reset was requested for your Campus Here account.\n` +
      `Open the link below within ${TOKEN_TTL_MINUTES} minutes to choose a new password:\n\n` +
      `${link}\n\n` +
      `If you did not request this, you can ignore this email — your password will not change.\n`,
  });

  return ok;
}
