import type { Metadata } from "next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { NoGroupPanel } from "@/components/student/group-panel";
import { getSelectedCycle } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/rbac";
import { findMyGroup } from "@/server/services/groups";
import { formatCgpa } from "@/lib/utils";

export const metadata: Metadata = { title: "Review Timeline" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Every phase in order, so unscheduled ones still appear as Pending. */
const PHASES = [
  { key: "R0", label: "Review 0 (R0)" },
  { key: "P1", label: "Phase 1 (P1)" },
  { key: "P2", label: "Phase 2 (P2)" },
] as const;

const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: "success",
  COMPLETED: "info",
  CANCELLED: "error",
};

export default async function TimelinePage() {
  const session = await requirePage(["STUDENT"]);
  const cycle = await getSelectedCycle();
  const studentId = session.studentId;

  if (!cycle || !studentId) {
    return (
      <>
        <PageHeader title="Review Timeline" role="Student" />
        <Card>
          <CardBody>
            <p className="text-ink-secondary text-sm">
              This account is not linked to a student record.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  const group = await findMyGroup(studentId, cycle.id);

  if (!group) {
    return (
      <>
        <PageHeader
          title="Review Timeline"
          subtitle="R0 → P1 → P2 schedule with outcomes."
          cycleName={cycle.name}
          role="Student"
        />
        <NoGroupPanel groupSize={cycle.groupSize} />
      </>
    );
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { groupId: group.id },
    select: { sessionId: true, score: true, remarks: true },
  });
  const evaluationBySession = new Map(
    evaluations.map((entry) => [entry.sessionId, entry]),
  );

  return (
    <>
      <PageHeader
        title="Review Timeline"
        subtitle="R0 → P1 → P2 schedule with outcomes."
        cycleName={cycle.name}
        role="Student"
      />

      <Card>
        <CardHeader
          title={`${group.code} · ${group.domain?.name ?? "No domain"}`}
          subtitle={
            group.allocation?.faculty?.fullName
              ? `Guide: ${group.allocation.faculty.fullName}`
              : "Guide not allocated yet"
          }
        />
        <CardBody className="space-y-3">
          {PHASES.map((phase) => {
            const session = group.sessions.find((s) => s.phase === phase.key);
            const evaluation = session
              ? evaluationBySession.get(session.id)
              : undefined;

            return (
              <div
                key={phase.key}
                className="border-border-subtle rounded-xl border px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">{phase.label}</p>
                    <p className="text-ink-secondary mt-0.5 text-xs">
                      {session
                        ? `${DATE_FORMAT.format(session.scheduledAt)} · ${session.venue}`
                        : "Not scheduled yet"}
                    </p>
                  </div>
                  <Badge
                    tone={
                      session ? (STATUS_TONE[session.status] ?? "neutral") : "neutral"
                    }
                  >
                    {session ? session.status : "PENDING"}
                  </Badge>
                </div>

                {evaluation && (
                  <div className="border-border-subtle mt-3 border-t pt-3">
                    <p className="text-ink text-sm">
                      Score{" "}
                      <span className="mono font-semibold">
                        {formatCgpa(Number(evaluation.score))}
                      </span>{" "}
                      / 10
                    </p>
                    {evaluation.remarks && (
                      <p className="text-ink-secondary mt-1 text-sm">
                        {evaluation.remarks}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {group.sessions.length === 0 && (
            <EmptyState
              title="No sessions scheduled yet"
              description="Your coordinator schedules R0 once allocation is complete."
            />
          )}
        </CardBody>
      </Card>
    </>
  );
}
