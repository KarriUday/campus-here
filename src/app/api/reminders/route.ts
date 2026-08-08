import { NextResponse } from "next/server";
import { requireApi } from "@/lib/rbac";
import { badRequest, resolveCycle } from "@/server/http";
import { CalendarError, generateReminders } from "@/server/services/calendar";
import { listRemindersForCycle } from "@/server/services/reminders";

export async function GET(request: Request) {
  const auth = await requireApi(["ADMIN", "FACULTY", "STUDENT"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  const reminders = await listRemindersForCycle(cycle.id);
  return NextResponse.json({
    reminders: reminders.map((reminder) => ({
      id: reminder.id,
      kind: reminder.kind,
      title: reminder.title,
      body: reminder.body,
      eventDate: reminder.eventDate.toISOString().slice(0, 10),
      dueAt: reminder.dueAt,
      status: reminder.liveStatus,
      storedStatus: reminder.status,
      attempts: reminder.attempts,
      lastError: reminder.lastError,
      sentAt: reminder.sentAt,
      phase: reminder.event?.phase ?? null,
    })),
  });
}

/** Regenerate both reminder windows for every detected event. */
export async function POST(request: Request) {
  const auth = await requireApi(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const cycle = await resolveCycle(request);
  if (!cycle) return badRequest("No project cycle is selected.");

  try {
    const summary = await generateReminders(cycle.id);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    if (error instanceof CalendarError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
