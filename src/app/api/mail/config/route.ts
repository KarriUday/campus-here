import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest } from "@/server/http";
import { encryptSecret, maskSecret } from "@/server/services/crypto";
import { isDryRun, verifySmtp } from "@/server/services/mailer";
import { facultySmtp } from "@/server/services/bulk-mail";

/** What the Mail Center shows about the current transport. Never the secret. */
export async function GET() {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const own =
    auth.session.role === "FACULTY" && auth.session.facultyId
      ? await prisma.faculty.findUnique({
          where: { id: auth.session.facultyId },
          select: { smtpUserEnc: true, smtpHost: true, smtpPort: true },
        })
      : null;

  const personal = await facultySmtp(auth.session.facultyId);

  return NextResponse.json({
    dryRun: isDryRun(),
    envConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    personalConfigured: Boolean(own?.smtpUserEnc),
    personalUser: personal ? maskSecret(personal.user) : null,
    host: own?.smtpHost ?? process.env.SMTP_HOST ?? null,
    port: own?.smtpPort ?? Number(process.env.SMTP_PORT ?? 587),
    hint: isDryRun()
      ? "Dry-run mode: sends are recorded but nothing leaves this machine. Set MAIL_DRY_RUN=false to go live."
      : personal
        ? "Sending through your own SMTP credentials."
        : "Sending through the server's configured SMTP account.",
  });
}

const ConfigSchema = z.object({
  smtpUser: z.email("Enter the full email address of the sending account."),
  smtpPass: z.string().min(8, "Enter the app password."),
  smtpHost: z.string().min(1).default("smtp.gmail.com"),
  smtpPort: z.number().int().min(1).max(65535).default(587),
});

/**
 * Store a guide's own SMTP credentials, encrypted at rest with AES-256-GCM.
 * The password is never returned by any endpoint once saved.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["FACULTY", "ADMIN"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.facultyId) {
    return badRequest("This account is not linked to a faculty record.");
  }

  const parsed = ConfigSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const { smtpUser, smtpPass, smtpHost, smtpPort } = parsed.data;
  // Gmail app passwords are shown in groups of four; users paste the spaces.
  const password = smtpPass.replace(/\s+/g, "");

  await prisma.faculty.update({
    where: { id: auth.session.facultyId },
    data: {
      smtpUserEnc: encryptSecret(smtpUser.trim().toLowerCase()),
      smtpPassEnc: encryptSecret(password),
      smtpHost,
      smtpPort,
    },
  });

  return NextResponse.json({
    ok: true,
    verified: false,
    hint: isDryRun()
      ? "Saved. Dry-run mode is still on, so nothing will actually be sent."
      : "Saved. Use Test connection to verify it before sending.",
  });
}

/** Remove stored credentials. */
export async function DELETE() {
  const auth = await requireApi(["FACULTY", "ADMIN"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.facultyId) {
    return badRequest("This account is not linked to a faculty record.");
  }

  await prisma.faculty.update({
    where: { id: auth.session.facultyId },
    data: { smtpUserEnc: null, smtpPassEnc: null },
  });
  return NextResponse.json({ ok: true });
}

/** Verify the stored credentials without sending anything. */
export async function PUT() {
  const auth = await requireApi(["FACULTY", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const credentials = await facultySmtp(auth.session.facultyId);
  if (!credentials) {
    return badRequest("No SMTP credentials are stored for this account.");
  }

  const result = await verifySmtp(credentials);
  return NextResponse.json({
    ok: result.ok,
    error: result.ok ? undefined : result.error,
  });
}
