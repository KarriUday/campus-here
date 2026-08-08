"use client";

import { History, Play, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCgpa } from "@/lib/utils";

export type UnallocatedRow = {
  groupId: string;
  groupCode: string;
  domain: string | null;
  avgCgpa: number;
  reason: string | null;
};

export type GuideOption = {
  id: string;
  fullName: string;
  available: number;
  capacity: number;
  domains: string[];
};

type Preview = {
  stable: boolean;
  rows: Array<{ groupCode: string; facultyName: string; rank: number }>;
  unallocatedRows: Array<{ groupCode: string; reason: string }>;
  stats: {
    groupsConsidered: number;
    facultyConsidered: number;
    allocated: number;
    unallocated: number;
    locked: number;
    proposals: number;
    rankHistogram: Record<number, number>;
  };
};

const REASON_LABEL: Record<string, string> = {
  ALL_PREFERENCES_FULL: "All six preferred guides were full",
  INVALID_PREFERENCES: "Preference list is incomplete or invalid",
  NO_PREFERENCES: "No preferences submitted",
  NOT_SUBMITTED: "Group has not submitted",
};

export function AllocationPanel({
  unallocated,
  guides,
  submittedCount,
}: {
  unallocated: UnallocatedRow[];
  guides: GuideOption[];
  submittedCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [confirmCommit, setConfirmCommit] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [chosenGuide, setChosenGuide] = useState<Record<string, string>>({});

  async function run(dryRun: boolean) {
    setBusy(dryRun ? "preview" : "commit");
    try {
      const res = await fetch("/api/allocation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Allocation failed", description: data.error });
        return;
      }

      if (dryRun) {
        setPreview(data);
        toast({
          tone: "info",
          title: "Preview computed — nothing written",
          description: `${data.stats.allocated} matched, ${data.stats.unallocated} unallocated.`,
        });
      } else {
        setPreview(null);
        setConfirmCommit(false);
        toast({
          tone: "success",
          title: "Allocation committed",
          description: `${data.stats.allocated} matched, ${data.stats.unallocated} unallocated.`,
        });
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function assign(groupId: string) {
    const facultyId = chosenGuide[groupId];
    if (!facultyId) {
      toast({ tone: "warning", title: "Pick a guide first." });
      return;
    }
    setAssigning(groupId);
    try {
      const res = await fetch("/api/allocation/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, facultyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not assign", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: "Assigned by hand",
        description: "This pairing is locked and later runs will not change it.",
      });
      router.refresh();
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Allocation control"
          subtitle="Gale-Shapley over six ranked preferences, with a hard capacity cap per guide. Preview first — it writes nothing."
          actions={
            <>
              <Button
                variant="secondary"
                loading={busy === "preview"}
                onClick={() => run(true)}
                icon={<Play className="size-3.5" aria-hidden />}
              >
                Preview
              </Button>
              <Button
                loading={busy === "commit"}
                disabled={submittedCount === 0}
                onClick={() => setConfirmCommit(true)}
                icon={<Wand2 className="size-3.5" aria-hidden />}
              >
                Run &amp; commit
              </Button>
            </>
          }
        />
        <CardBody>
          <p className="text-ink-secondary text-sm">
            Ranking on a contested guide: domain match, then higher average
            CGPA, then earlier submission, then group code. The last is a
            deterministic tiebreak, so re-running identical data produces an
            identical matching.
          </p>

          {preview && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone={preview.stable ? "success" : "error"}>
                  {preview.stable ? "Stable — no blocking pair" : "UNSTABLE"}
                </Badge>
                <Badge tone="neutral">
                  {preview.stats.groupsConsidered} groups ·{" "}
                  {preview.stats.facultyConsidered} guides
                </Badge>
                <Badge tone="success">{preview.stats.allocated} matched</Badge>
                <Badge
                  tone={preview.stats.unallocated > 0 ? "warning" : "neutral"}
                >
                  {preview.stats.unallocated} unallocated
                </Badge>
                {preview.stats.locked > 0 && (
                  <Badge tone="info">{preview.stats.locked} manual, kept</Badge>
                )}
                <Badge tone="neutral">
                  {preview.stats.proposals} proposals
                </Badge>
              </div>

              <div>
                <p className="text-ink mb-2 text-sm font-medium">
                  Preference satisfied
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.stats.rankHistogram)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([rank, count]) => (
                      <span
                        key={rank}
                        className="border-border-subtle rounded-lg border px-3 py-1.5 text-xs"
                      >
                        Choice #{rank}:{" "}
                        <span className="text-ink mono font-semibold">
                          {count}
                        </span>
                      </span>
                    ))}
                </div>
              </div>

              <details className="border-border-subtle rounded-xl border p-3">
                <summary className="text-ink cursor-pointer text-sm font-medium">
                  Proposed matching ({preview.rows.length})
                </summary>
                <div className="mt-3">
                  <DataTable
                    rows={preview.rows}
                    rowKey={(row) => row.groupCode}
                    columns={[
                      {
                        key: "group",
                        header: "Group",
                        render: (row) => <span className="mono">{row.groupCode}</span>,
                      },
                      { key: "guide", header: "Guide", render: (row) => row.facultyName },
                      {
                        key: "rank",
                        header: "Choice",
                        numeric: true,
                        render: (row) => `#${row.rank}`,
                      },
                    ]}
                  />
                </div>
              </details>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Unallocated queue"
          subtitle="Groups the engine could not place. Assigning by hand locks the pairing."
          actions={
            <Badge tone={unallocated.length > 0 ? "warning" : "success"}>
              {unallocated.length} waiting
            </Badge>
          }
        />
        <CardBody className="space-y-3">
          {unallocated.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              description="Every submitted group holds a guide."
            />
          ) : (
            unallocated.map((row) => (
              <div
                key={row.groupId}
                className="border-border-subtle flex flex-wrap items-end justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-ink text-sm font-medium">
                    <span className="mono">{row.groupCode}</span> ·{" "}
                    {row.domain ?? "no domain"} · avg CGPA{" "}
                    {formatCgpa(row.avgCgpa)}
                  </p>
                  <p className="text-ink-secondary text-xs">
                    {row.reason
                      ? (REASON_LABEL[row.reason] ?? row.reason)
                      : "Never included in a run"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`guide-${row.groupId}`}>
                    Guide for {row.groupCode}
                  </label>
                  <select
                    id={`guide-${row.groupId}`}
                    value={chosenGuide[row.groupId] ?? ""}
                    onChange={(event) =>
                      setChosenGuide((current) => ({
                        ...current,
                        [row.groupId]: event.target.value,
                      }))
                    }
                    className="border-border bg-surface-raised text-ink h-9 max-w-64 rounded-lg border px-2 text-sm"
                  >
                    <option value="">— Choose a guide —</option>
                    {guides
                      .filter((guide) => guide.available > 0)
                      .map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.fullName} ({guide.available} free)
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    loading={assigning === row.groupId}
                    onClick={() => assign(row.groupId)}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmCommit}
        onClose={() => setConfirmCommit(false)}
        onConfirm={() => run(false)}
        loading={busy === "commit"}
        confirmLabel="Run and commit"
        title="Commit the allocation?"
        description={`This recomputes every engine-made allocation for ${submittedCount} submitted group(s) inside one serializable transaction. Manual assignments are preserved.`}
      />
    </div>
  );
}

export function RunHistory({
  runs,
}: {
  runs: Array<{
    id: string;
    startedAt: string;
    durationMs: number | null;
    groupsConsidered: number;
    allocatedCount: number;
    unallocatedCount: number;
    triggeredBy: string;
  }>;
}) {
  return (
    <Card className="mt-6">
      <CardHeader
        title="Run history"
        subtitle="Every allocation run is recorded with the parameters it used."
        actions={<History className="text-ink-tertiary size-4" aria-hidden />}
      />
      <CardBody>
        <DataTable
          rows={runs}
          rowKey={(row) => row.id}
          emptyTitle="No runs yet"
          emptyDescription="Press Run & commit to record the first one."
          columns={[
            {
              key: "when",
              header: "Started",
              render: (row) => new Date(row.startedAt).toLocaleString("en-IN"),
            },
            {
              key: "groups",
              header: "Groups",
              numeric: true,
              render: (row) => row.groupsConsidered,
            },
            {
              key: "allocated",
              header: "Allocated",
              numeric: true,
              render: (row) => row.allocatedCount,
            },
            {
              key: "unallocated",
              header: "Unallocated",
              numeric: true,
              render: (row) => row.unallocatedCount,
            },
            {
              key: "duration",
              header: "Took",
              numeric: true,
              render: (row) => (row.durationMs === null ? "—" : `${row.durationMs} ms`),
            },
            { key: "by", header: "By", render: (row) => row.triggeredBy },
          ]}
        />
      </CardBody>
    </Card>
  );
}
