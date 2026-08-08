"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type SchedulableGroup = {
  id: string;
  code: string;
  guide: string | null;
  domain: string | null;
};

export type SessionRow = {
  id: string;
  groupCode: string;
  phase: string;
  scheduledAt: string;
  venue: string;
  durationMinutes: number;
  status: string;
  guide: string | null;
  attendanceMarked: boolean;
  evaluated: boolean;
};

const STATUS_TONE: Record<string, BadgeTone> = {
  SCHEDULED: "success",
  COMPLETED: "info",
  CANCELLED: "error",
};

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SchedulePanel({
  groups,
  sessions,
  venues,
}: {
  groups: SchedulableGroup[];
  sessions: SessionRow[];
  venues: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [phase, setPhase] = useState("R0");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState(venues[0] ?? "Seminar Hall 1");
  const [duration, setDuration] = useState(20);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function schedule(force: boolean) {
    if (!groupId || !scheduledAt) {
      toast({ tone: "warning", title: "Pick a group and a time first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          phase,
          // datetime-local has no timezone; the browser's local zone is right.
          scheduledAt: new Date(scheduledAt).toISOString(),
          venue,
          durationMinutes: duration,
          force,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setConflicts(data.conflicts.map((c: { detail: string }) => c.detail));
        toast({
          tone: "warning",
          title: "Scheduling clash",
          description: "Review the clash below, then override if it is intended.",
        });
        return;
      }
      if (!res.ok) {
        toast({ tone: "error", title: "Could not schedule", description: data.error });
        return;
      }

      setConflicts([]);
      toast({
        tone: "success",
        title: `${phase} scheduled`,
        description: force ? "Saved despite the reported clash." : undefined,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Schedule a review"
          subtitle="One guide cannot be in two rooms, and one room cannot hold two reviews. Clashes are reported before saving."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Select
              label="Group"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.code}
                  {group.guide ? ` · ${group.guide}` : " · no guide"}
                </option>
              ))}
            </Select>
            <Select
              label="Phase"
              value={phase}
              onChange={(event) => setPhase(event.target.value)}
            >
              <option value="R0">Review 0 (R0)</option>
              <option value="P1">Phase 1 (P1)</option>
              <option value="P2">Phase 2 (P2)</option>
            </Select>
            <Input
              label="Date and time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
            <Select
              label="Venue"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
            >
              {venues.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Input
              label="Minutes"
              type="number"
              min={5}
              max={240}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </div>

          {conflicts.length > 0 && (
            <div className="bg-warning-soft rounded-xl px-4 py-3">
              <p className="text-warning-ink text-sm font-medium">
                This slot clashes with:
              </p>
              <ul className="text-warning-ink mt-1 list-inside list-disc text-sm">
                {conflicts.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => schedule(false)}
              loading={busy}
              disabled={groups.length === 0}
              icon={<CalendarPlus className="size-3.5" aria-hidden />}
            >
              Schedule
            </Button>
            {conflicts.length > 0 && (
              <Button variant="secondary" onClick={() => schedule(true)} loading={busy}>
                Schedule anyway
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Scheduled sessions"
          subtitle="Every review booked for this cycle."
          actions={<Badge tone="neutral">{sessions.length}</Badge>}
        />
        <CardBody>
          <DataTable
            rows={sessions}
            rowKey={(row) => row.id}
            emptyTitle="Nothing scheduled yet"
            emptyDescription="Book R0 for allocated groups using the form above."
            columns={[
              {
                key: "when",
                header: "When",
                render: (row) => DATE_TIME.format(new Date(row.scheduledAt)),
              },
              {
                key: "phase",
                header: "Phase",
                render: (row) => <Badge tone="info">{row.phase}</Badge>,
              },
              {
                key: "group",
                header: "Group",
                render: (row) => <span className="mono">{row.groupCode}</span>,
              },
              { key: "guide", header: "Guide", render: (row) => row.guide ?? "—" },
              { key: "venue", header: "Venue", render: (row) => row.venue },
              {
                key: "progress",
                header: "Progress",
                render: (row) => (
                  <span className="flex gap-1">
                    <Badge tone={row.attendanceMarked ? "success" : "neutral"}>
                      {row.attendanceMarked ? "Attendance" : "No attendance"}
                    </Badge>
                    <Badge tone={row.evaluated ? "success" : "neutral"}>
                      {row.evaluated ? "Marked" : "Unmarked"}
                    </Badge>
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
