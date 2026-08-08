import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";

/**
 * The student's in-app inbox, and the polling half of the two-tier delivery
 * the prototype also used. `?since=` returns only what arrived after a
 * timestamp, so the client can poll cheaply when SSE is unavailable.
 */
export async function GET(request: Request) {
  const auth = await requireApi(["STUDENT", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const url = new URL(request.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;

  if (auth.session.role === "STUDENT" && !auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      cycleId: cycle.id,
      // A student only ever sees their own inbox.
      ...(auth.session.role === "STUDENT"
        ? { studentId: auth.session.studentId }
        : {}),
      ...(since && !Number.isNaN(since.getTime())
        ? { createdAt: { gt: since } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      subject: notification.subject,
      body: notification.body,
      senderName: notification.senderName,
      status: notification.status,
      previewUrl: notification.previewUrl,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    })),
  });
}

/** Mark the caller's notifications as read. */
export async function PATCH(request: Request) {
  const auth = await requireApi(["STUDENT"]);
  if (!auth.ok) return auth.response;
  if (!auth.session.studentId) {
    return badRequest("This account is not linked to a student record.");
  }

  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  const updated = await prisma.notification.updateMany({
    where: {
      studentId: auth.session.studentId,
      readAt: null,
      ...(ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, marked: updated.count });
}
