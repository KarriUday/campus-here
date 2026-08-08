import { prisma } from "@/lib/prisma";
import { decryptSecret } from "./crypto";
import {
  isDryRun,
  sendRawMail,
  type MailAttachment,
  type SmtpCredentials,
} from "./mailer";

/**
 * Bulk sending on top of the single transport in `mailer.ts`.
 *
 * Recipients are BCC'd so students never see each other's addresses, and a
 * per-recipient Notification row is written for every send — that row is both
 * the student's in-app inbox and the per-person delivery record behind the
 * aggregate counts on EmailMessage.
 *
 * A dry run is recorded exactly like a live one, but with mode=DRY_RUN
 * throughout. It is never reported as delivered.
 */

export class MailError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "MailError";
  }
}

/** Spec §3.8 caps the total attachment payload at 20MB. */
export function maxAttachmentBytes() {
  return Number(process.env.MAIL_MAX_ATTACHMENT_BYTES ?? 20 * 1024 * 1024);
}

export type RecipientMode = "ALL" | "MY_GROUPS" | "SELECTED";

export type ResolvedRecipient = {
  studentId: string | null;
  email: string;
  usn: string | null;
  fullName: string;
};

/**
 * Who a send goes to. A faculty member addressing "their students" resolves to
 * the members of the groups they actually guide, scoped server-side — they
 * cannot broadcast to another guide's groups.
 */
export async function resolveRecipients(options: {
  cycleId: string;
  mode: RecipientMode;
  facultyId?: string | null;
  studentIds?: string[];
  extraEmails?: string[];
}): Promise<ResolvedRecipient[]> {
  const { cycleId, mode, facultyId, studentIds = [], extraEmails = [] } = options;
  let students: Array<{ id: string; email: string; usn: string; fullName: string }> = [];

  if (mode === "MY_GROUPS") {
    if (!facultyId) throw new MailError("No faculty record for this account.", 403);
    students = await prisma.student.findMany({
      where: {
        memberships: {
          some: {
            cycleId,
            group: { allocation: { facultyId, status: "ALLOCATED" } },
          },
        },
      },
      select: { id: true, email: true, usn: true, fullName: true },
    });
  } else if (mode === "SELECTED") {
    students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        enrollments: { some: { cycleId } },
        // A guide may only pick from their own students.
        ...(facultyId
          ? {
              memberships: {
                some: {
                  cycleId,
                  group: { allocation: { facultyId, status: "ALLOCATED" } },
                },
              },
            }
          : {}),
      },
      select: { id: true, email: true, usn: true, fullName: true },
    });
  } else {
    if (facultyId) {
      throw new MailError(
        "Only an administrator can email the whole cycle.",
        403,
      );
    }
    students = await prisma.student.findMany({
      where: { enrollments: { some: { cycleId } } },
      select: { id: true, email: true, usn: true, fullName: true },
    });
  }

  const recipients: ResolvedRecipient[] = students.map((student) => ({
    studentId: student.id,
    email: student.email,
    usn: student.usn,
    fullName: student.fullName,
  }));

  // Manually typed extras are allowed but get no student link.
  const seen = new Set(recipients.map((r) => r.email.toLowerCase()));
  for (const raw of extraEmails) {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ studentId: null, email, usn: null, fullName: email });
  }

  return recipients;
}

/** Per-faculty SMTP credentials, decrypted only at send time. */
export async function facultySmtp(
  facultyId: string | null | undefined,
): Promise<SmtpCredentials | undefined> {
  if (!facultyId) return undefined;
  const record = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: { smtpUserEnc: true, smtpPassEnc: true, smtpHost: true, smtpPort: true },
  });
  if (!record?.smtpUserEnc || !record.smtpPassEnc) return undefined;

  const user = decryptSecret(record.smtpUserEnc);
  const pass = decryptSecret(record.smtpPassEnc);
  if (!user || !pass) return undefined;

  return {
    host: record.smtpHost ?? "smtp.gmail.com",
    port: record.smtpPort ?? 587,
    secure: (record.smtpPort ?? 587) === 465,
    user,
    pass,
  };
}

export async function sendBulkMail(options: {
  cycleId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  body: string;
  recipients: ResolvedRecipient[];
  attachments?: MailAttachment[];
  facultyId?: string | null;
}) {
  const { recipients, attachments = [] } = options;
  if (recipients.length === 0) {
    throw new MailError("No recipients — nobody matches that selection.");
  }

  const totalBytes = attachments.reduce((sum, file) => sum + file.content.byteLength, 0);
  if (totalBytes > maxAttachmentBytes()) {
    throw new MailError(
      `Attachments total ${(totalBytes / 1024 / 1024).toFixed(1)}MB, over the ${(
        maxAttachmentBytes() /
        1024 /
        1024
      ).toFixed(0)}MB limit.`,
    );
  }

  const override = await facultySmtp(options.facultyId);

  const result = await sendRawMail({
    // One visible To (the sender), everyone else BCC'd.
    to: process.env.SMTP_FROM ?? override?.user ?? "no-reply@example.com",
    bcc: recipients.map((r) => r.email),
    subject: options.subject,
    text: options.body,
    attachments,
    transportOverride: override,
    fromName: options.senderName,
  });

  const delivered = result.delivered ? recipients.length : 0;

  const message = await prisma.$transaction(async (tx) => {
    const email = await tx.emailMessage.create({
      data: {
        cycleId: options.cycleId,
        subject: options.subject,
        body: options.body,
        senderName: options.senderName,
        senderRole: options.senderRole,
        senderUserId: options.senderUserId,
        recipientCount: recipients.length,
        delivered,
        failed: recipients.length - delivered,
        mode: result.mode,
        smtpMode: result.smtpMode,
        error: result.error,
        attachments: attachments.map((file) => ({
          filename: file.filename,
          mimeType: file.contentType ?? "application/octet-stream",
          size: file.content.byteLength,
        })),
      },
    });

    await tx.notification.createMany({
      data: recipients.map((recipient) => ({
        emailMessageId: email.id,
        studentId: recipient.studentId,
        cycleId: options.cycleId,
        toEmail: recipient.email,
        usn: recipient.usn,
        subject: options.subject,
        body: options.body,
        senderName: options.senderName,
        status: result.delivered
          ? ("DELIVERED" as const)
          : result.mode === "DRY_RUN"
            ? ("DRY_RUN" as const)
            : ("FAILED" as const),
        error: result.error,
        previewUrl: result.previewUrl,
      })),
    });

    return email;
  });

  return {
    messageId: message.id,
    recipientCount: recipients.length,
    delivered,
    failed: recipients.length - delivered,
    mode: result.mode,
    smtpMode: result.smtpMode,
    error: result.error,
    previewUrl: result.previewUrl,
    dryRun: isDryRun(),
  };
}
