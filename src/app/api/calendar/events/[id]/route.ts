import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/rbac";
import { notFound } from "@/server/http";

/** Remove a wrongly-detected event. Its reminders cascade away with it. */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/calendar/events/[id]">,
) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return notFound("No such calendar event.");

  const removed = await prisma.$transaction(async (tx) => {
    const reminders = await tx.reminder.deleteMany({ where: { eventId: id } });
    await tx.calendarEvent.delete({ where: { id } });
    return reminders.count;
  });

  return NextResponse.json({ ok: true, remindersRemoved: removed });
}
