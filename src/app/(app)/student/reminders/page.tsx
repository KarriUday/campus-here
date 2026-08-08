import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSelectedCycle } from "@/lib/cycle";
import { requirePage } from "@/lib/rbac";
import {
  listRemindersForCycle,
  REMINDER_KIND_LABEL,
} from "@/server/services/reminders";

export const metadata: Metadata = { title: "Reminders" };

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const DATE_ONLY = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const STATUS_TONE: Record<string, BadgeTone> = {
  DUE: "warning",
  SENT: "success",
  QUEUED: "neutral",
  FAILED: "error",
};

export default async function RemindersPage() {
  await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Reminders" role="Student" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">No cycle selected.</p>
          </CardBody>
        </Card>
      </>
    );
  }

  // Status is recomputed against the wall clock inside the service, so a
  // reminder reads as due the moment its time passes rather than waiting for
  // the nightly cron.
  const withLiveStatus = await listRemindersForCycle(cycle.id);

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Generated from the academic calendar your coordinator uploaded."
        cycleName={cycle.name}
        role="Student"
      />

      <Card>
        <CardHeader
          title={`${withLiveStatus.length} reminder${withLiveStatus.length === 1 ? "" : "s"}`}
          subtitle="Each review date produces one 15-day and one 7-day reminder, dispatched at 09:00."
        />
        <CardBody className="space-y-3">
          {withLiveStatus.length === 0 ? (
            <EmptyState
              title="No reminders yet"
              description="They appear once the coordinator uploads the academic calendar PDF."
            />
          ) : (
            withLiveStatus.map((reminder) => (
              <div
                key={reminder.id}
                className="border-border-subtle border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">
                      {reminder.title}
                    </p>
                    <p className="text-ink-secondary mt-0.5 text-xs">
                      {REMINDER_KIND_LABEL[reminder.kind] ?? reminder.kind} ·
                      reminder{" "}
                      {DATE_TIME.format(reminder.dueAt)} · event{" "}
                      {DATE_ONLY.format(reminder.eventDate)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[reminder.liveStatus] ?? "neutral"}>
                    {reminder.liveStatus}
                  </Badge>
                </div>

                <p className="text-ink-secondary mt-3 border-primary border-l-2 pl-4 py-1 text-sm whitespace-pre-wrap">
                  {reminder.body}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </>
  );
}
