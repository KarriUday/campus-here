import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarPanel } from "@/components/admin/calendar-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import {
  listRemindersForCycle,
  REMINDER_KIND_LABEL,
} from "@/server/services/reminders";

export const metadata: Metadata = { title: "Calendar PDF → Reminders" };

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_TONE: Record<string, BadgeTone> = {
  DUE: "warning",
  SENT: "success",
  QUEUED: "neutral",
  FAILED: "error",
};

export default async function CalendarPage() {
  await requirePage(["ADMIN"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Calendar PDF → Reminders" role="Admin" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  const [latest, events, reminders] = await Promise.all([
    prisma.calendarImport.findFirst({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { cycleId: cycle.id },
      orderBy: { eventDate: "asc" },
      include: { _count: { select: { reminders: true } } },
    }),
    listRemindersForCycle(cycle.id),
  ]);

  return (
    <>
      <PageHeader
        title="Calendar PDF → Reminders"
        subtitle="Extract review dates from the academic calendar and queue reminders for students."
        cycleName={cycle.name}
        role="Admin"
      />

      <CalendarPanel
        latest={
          latest
            ? {
                filename: latest.filename,
                extractedChars: latest.extractedChars,
                detectedEvents: latest.detectedEvents,
                createdAt: latest.createdAt.toISOString(),
                uploadedBy: latest.uploadedBy.name,
                textPreview: latest.rawText.slice(0, 4000),
              }
            : null
        }
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          phase: event.phase,
          eventDate: event.eventDate.toISOString().slice(0, 10),
          confidence: event.confidence,
          sourceLine: event.sourceLine,
          reminderCount: event._count.reminders,
        }))}
      />

      <Card className="mt-6">
        <CardHeader
          title="Reminder queue"
          subtitle="Dispatched by Vercel Cron at 09:00 IST. Status is recomputed live against the clock."
          actions={<Badge tone="neutral">{reminders.length} queued</Badge>}
        />
        <CardBody>
          <DataTable
            rows={reminders}
            rowKey={(row) => row.id}
            emptyTitle="No reminders yet"
            emptyDescription="Generate them once review dates have been detected."
            columns={[
              {
                key: "due",
                header: "Reminder time",
                render: (row) => DATE_TIME.format(row.dueAt),
              },
              {
                key: "kind",
                header: "Window",
                render: (row) => REMINDER_KIND_LABEL[row.kind] ?? row.kind,
              },
              {
                key: "event",
                header: "Event date",
                render: (row) => (
                  <span className="mono">
                    {row.eventDate.toISOString().slice(0, 10)}
                  </span>
                ),
              },
              {
                key: "phase",
                header: "Phase",
                render: (row) => row.event?.phase ?? "—",
              },
              {
                key: "attempts",
                header: "Attempts",
                numeric: true,
                render: (row) => row.attempts,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={STATUS_TONE[row.liveStatus] ?? "neutral"}>
                    {row.liveStatus}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}
