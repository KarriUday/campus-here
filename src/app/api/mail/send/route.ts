import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import {
  MailError,
  maxAttachmentBytes,
  resolveRecipients,
  sendBulkMail,
  type RecipientMode,
} from "@/server/services/bulk-mail";
import type { MailAttachment } from "@/server/services/mailer";

/**
 * Send to a cycle (admin) or to a guide's own groups (faculty).
 *
 * Accepts multipart so attachments can ride along, or plain JSON when there
 * are none. Recipients are always resolved server-side from the caller's
 * identity — a guide cannot address another guide's students.
 */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const isFaculty = auth.session.role === "FACULTY";
  const contentType = request.headers.get("content-type") ?? "";

  let subject = "";
  let body = "";
  let mode: RecipientMode = isFaculty ? "MY_GROUPS" : "ALL";
  let studentIds: string[] = [];
  let extraEmails: string[] = [];
  const attachments: MailAttachment[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    subject = String(form.get("subject") ?? "");
    body = String(form.get("body") ?? "");
    if (form.get("mode")) mode = String(form.get("mode")) as RecipientMode;
    studentIds = form.getAll("studentIds").map(String).filter(Boolean);
    extraEmails = String(form.get("extraEmails") ?? "")
      .split(/[,;\s]+/)
      .filter(Boolean);

    let total = 0;
    for (const entry of form.getAll("attachments")) {
      if (typeof entry === "string") continue;
      total += entry.size;
      if (total > maxAttachmentBytes()) {
        return badRequest(
          `Attachments exceed the ${(maxAttachmentBytes() / 1024 / 1024).toFixed(0)}MB total limit.`,
        );
      }
      attachments.push({
        filename: entry.name,
        content: Buffer.from(await entry.arrayBuffer()),
        contentType: entry.type || undefined,
      });
    }
  } else {
    const payload = await request.json().catch(() => null);
    if (!payload) return badRequest("Invalid request body.");
    subject = String(payload.subject ?? "");
    body = String(payload.body ?? "");
    if (payload.mode) mode = payload.mode as RecipientMode;
    studentIds = Array.isArray(payload.studentIds) ? payload.studentIds : [];
    extraEmails = Array.isArray(payload.extraEmails) ? payload.extraEmails : [];
  }

  if (!subject.trim()) return badRequest("A subject is required.");
  if (!body.trim()) return badRequest("A message body is required.");

  // A guide can never widen their own scope to the whole cycle.
  if (isFaculty && mode === "ALL") mode = "MY_GROUPS";

  try {
    const recipients = await resolveRecipients({
      cycleId: cycle.id,
      mode,
      facultyId: isFaculty ? auth.session.facultyId : null,
      studentIds,
      extraEmails,
    });

    const sender = await prisma.user.findUniqueOrThrow({
      where: { id: auth.session.userId },
      select: { name: true },
    });

    const result = await sendBulkMail({
      cycleId: cycle.id,
      senderUserId: auth.session.userId,
      senderName: sender.name,
      senderRole: auth.session.role,
      subject: subject.trim(),
      body: body.trim(),
      recipients,
      attachments,
      facultyId: isFaculty ? auth.session.facultyId : null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof MailError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
