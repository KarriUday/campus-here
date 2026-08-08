import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  // A guide sees only what they sent.
  const scope =
    auth.session.role === "FACULTY"
      ? { senderUserId: auth.session.userId }
      : {};

  const messages = await prisma.emailMessage.findMany({
    where: { cycleId: cycle.id, ...scope },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    history: messages.map((message) => ({
      id: message.id,
      subject: message.subject,
      bodyPreview: message.body.slice(0, 160),
      senderName: message.senderName,
      senderRole: message.senderRole,
      recipientCount: message.recipientCount,
      delivered: message.delivered,
      failed: message.failed,
      mode: message.mode,
      smtpMode: message.smtpMode,
      error: message.error,
      attachments: message.attachments,
      createdAt: message.createdAt,
    })),
  });
}
