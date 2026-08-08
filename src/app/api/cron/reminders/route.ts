import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liveReminderStatus } from "@/lib/reminder-status";
import { isDryRun, sendRawMail } from "@/server/services/mailer";

/**
 * Nightly reminder dispatch.
 *
 * Production runs this from Vercel Cron (`vercel.json`, 03:30 UTC = 09:00 IST)
 * because an in-process `node-cron` cannot survive on serverless — functions
 * only exist for the duration of a request. `npm run cron` calls this same
 * route locally, so there is one dispatch implementation, not two.
 */

/** Give up after this many attempts and mark the reminder FAILED. */
const MAX_ATTEMPTS = 3;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  // Constant-time compare, guarding the length mismatch timingSafeEqual throws on.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const now = new Date();
  const candidates = await prisma.reminder.findMany({
    where: {
      status: { in: ["QUEUED", "DUE"] },
      dueAt: { lte: now },
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { dueAt: "asc" },
    take: 100,
    include: {
      cycle: {
        select: {
          id: true,
          name: true,
          enrollments: {
            select: { student: { select: { id: true, email: true, usn: true } } },
          },
        },
      },
    },
  });

  let dispatched = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of candidates) {
    // Defensive: the query already filters, but the rule lives in one place.
    if (liveReminderStatus(reminder, now) !== "DUE") {
      skipped += 1;
      continue;
    }

    const recipients = reminder.cycle.enrollments.map((e) => e.student);
    if (recipients.length === 0) {
      skipped += 1;
      continue;
    }

    const result = await sendRawMail({
      // Everyone is BCC'd; the visible To is the sending account itself.
      to: process.env.SMTP_FROM ?? "no-reply@example.com",
      bcc: recipients.map((student) => student.email),
      subject: reminder.title,
      text: reminder.body,
    });

    const message = await prisma.$transaction(async (tx) => {
      const email = await tx.emailMessage.create({
        data: {
          cycleId: reminder.cycleId,
          subject: reminder.title,
          body: reminder.body,
          senderName: "Campus Here",
          senderRole: "SYSTEM",
          senderUserId: (
            await tx.user.findFirstOrThrow({
              where: { role: "ADMIN" },
              select: { id: true },
            })
          ).id,
          reminderId: reminder.id,
          recipientCount: recipients.length,
          delivered: result.delivered ? recipients.length : 0,
          failed: result.delivered ? 0 : recipients.length,
          mode: result.mode,
          smtpMode: result.smtpMode,
          error: result.error,
        },
      });

      await tx.notification.createMany({
        data: recipients.map((student) => ({
          emailMessageId: email.id,
          studentId: student.id,
          cycleId: reminder.cycleId,
          toEmail: student.email,
          usn: student.usn,
          subject: reminder.title,
          body: reminder.body,
          senderName: "Campus Here",
          status: result.delivered
            ? ("DELIVERED" as const)
            : result.mode === "DRY_RUN"
              ? ("DRY_RUN" as const)
              : ("FAILED" as const),
          error: result.error,
        })),
      });

      return email;
    });

    const attempts = reminder.attempts + 1;
    // A dry run is a real, recorded attempt that deliberately did not leave
    // the machine — it is marked SENT so the queue drains in development,
    // but every row it wrote carries mode=DRY_RUN.
    const succeeded = result.delivered || result.mode === "DRY_RUN";

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        attempts,
        status: succeeded ? "SENT" : attempts >= MAX_ATTEMPTS ? "FAILED" : "DUE",
        sentAt: succeeded ? new Date() : null,
        lastError: result.error ?? null,
      },
    });

    if (succeeded) dispatched += 1;
    else failed += 1;
    void message;
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    considered: candidates.length,
    dispatched,
    failed,
    skipped,
    mode: isDryRun() ? "DRY_RUN" : "LIVE",
  });
}
