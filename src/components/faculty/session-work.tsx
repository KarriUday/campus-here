"use client";

import { Check, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type SessionOption = {
  id: string;
  groupCode: string;
  phase: string;
  scheduledAt: string;
  venue: string;
  attendanceMarked: boolean;
  evaluated: boolean;
};

export type RosterEntry = {
  studentId: string;
  usn: string;
  fullName: string;
  status: "PRESENT" | "ABSENT" | null;
};

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function sessionLabel(session: SessionOption) {
  return `${session.groupCode} · ${session.phase} · ${DATE_TIME.format(new Date(session.scheduledAt))}`;
}

export function AttendanceMarker({
  sessions,
  initialSessionId,
  initialRoster,
}: {
  sessions: SessionOption[];
  initialSessionId: string | null;
  initialRoster: RosterEntry[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [roster, setRoster] = useState(initialRoster);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadRoster(id: string) {
    setSessionId(id);
    if (!id) {
      setRoster([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?sessionId=${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not load roster", description: data.error });
        setRoster([]);
        return;
      }
      setRoster(data.roster);
    } finally {
      setLoading(false);
    }
  }

  function setStatus(studentId: string, status: "PRESENT" | "ABSENT") {
    setRoster((current) =>
      current.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry,
      ),
    );
  }

  async function save() {
    const entries = roster.filter((entry) => entry.status !== null);
    if (entries.length === 0) {
      toast({ tone: "warning", title: "Mark at least one student first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          entries: entries.map((entry) => ({
            studentId: entry.studentId,
            status: entry.status,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `Attendance saved for ${data.marked} student(s)`,
        description: "The session is now marked completed.",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allMarked = roster.length > 0 && roster.every((e) => e.status !== null);

  return (
    <Card>
      <CardHeader
        title="Mark attendance"
        subtitle="Per review session. Saving marks the session completed."
        actions={
          <Button
            onClick={save}
            loading={busy}
            disabled={!sessionId || roster.length === 0}
            icon={<Save className="size-3.5" aria-hidden />}
          >
            Save attendance
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions assigned to you"
            description="Sessions appear once the coordinator schedules reviews for your groups."
          />
        ) : (
          <>
            <Select
              label="Session"
              value={sessionId}
              onChange={(event) => loadRoster(event.target.value)}
            >
              <option value="">— Choose a session —</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {sessionLabel(session)}
                  {session.attendanceMarked ? " · marked" : ""}
                </option>
              ))}
            </Select>

            {loading && (
              <p className="text-ink-secondary text-sm">Loading roster…</p>
            )}

            {!loading && roster.length > 0 && (
              <>
                <ul className="space-y-2">
                  {roster.map((entry) => (
                    <li
                      key={entry.studentId}
                      className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border px-4 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="text-ink text-sm font-medium">
                          {entry.fullName}
                        </span>{" "}
                        <span className="text-ink-secondary mono text-xs">
                          {entry.usn}
                        </span>
                      </span>
                      <span
                        className="flex gap-1"
                        role="radiogroup"
                        aria-label={`Attendance for ${entry.fullName}`}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={entry.status === "PRESENT"}
                          onClick={() => setStatus(entry.studentId, "PRESENT")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                            entry.status === "PRESENT"
                              ? "bg-success-soft text-success-ink"
                              : "text-ink-secondary hover:bg-surface",
                          )}
                        >
                          <Check className="size-3.5" aria-hidden />
                          Present
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={entry.status === "ABSENT"}
                          onClick={() => setStatus(entry.studentId, "ABSENT")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                            entry.status === "ABSENT"
                              ? "bg-error-soft text-error-ink"
                              : "text-ink-secondary hover:bg-surface",
                          )}
                        >
                          <X className="size-3.5" aria-hidden />
                          Absent
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                {!allMarked && (
                  <p className="text-ink-secondary text-sm">
                    {roster.filter((e) => e.status === null).length} student(s)
                    still unmarked — only marked students are saved.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function EvaluationForm({
  sessions,
  existing,
}: {
  sessions: SessionOption[];
  existing: Array<{ sessionId: string; score: number; remarks: string | null }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const byId = new Map(existing.map((row) => [row.sessionId, row]));

  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [score, setScore] = useState(
    () => byId.get(sessions[0]?.id ?? "")?.score ?? 7.5,
  );
  const [remarks, setRemarks] = useState(
    () => byId.get(sessions[0]?.id ?? "")?.remarks ?? "",
  );
  const [busy, setBusy] = useState(false);

  function choose(id: string) {
    setSessionId(id);
    const prior = byId.get(id);
    setScore(prior?.score ?? 7.5);
    setRemarks(prior?.remarks ?? "");
  }

  async function save() {
    if (!sessionId) {
      toast({ tone: "warning", title: "Choose a session first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, score, remarks: remarks.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({ tone: "success", title: `Score ${data.evaluation.score} / 10 saved` });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Evaluate a group"
        subtitle="Score out of 10 with remarks, saved per group per phase."
        actions={
          <Button
            onClick={save}
            loading={busy}
            disabled={sessions.length === 0}
            icon={<Save className="size-3.5" aria-hidden />}
          >
            Save evaluation
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions to evaluate"
            description="Sessions appear once reviews are scheduled for your groups."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                label="Session"
                value={sessionId}
                onChange={(event) => choose(event.target.value)}
                wrapperClassName="sm:col-span-2"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {sessionLabel(session)}
                    {byId.has(session.id) ? " · marked" : ""}
                  </option>
                ))}
              </Select>
              <Input
                label="Score (out of 10)"
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
              />
            </div>
            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="What went well, and what the group must fix before the next review."
              className="min-h-28"
            />
            {byId.has(sessionId) && (
              <Badge tone="info">
                Updating an existing evaluation for this session
              </Badge>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
