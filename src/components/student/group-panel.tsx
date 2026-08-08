"use client";

import { Check, LogOut, Send, X } from "lucide-react";
import Link from "next/link";
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

export type GroupMemberView = {
  id: string;
  role: "LEADER" | "MEMBER";
  usn: string;
  fullName: string;
  email: string;
  cgpa: number;
};

export type GroupView = {
  id: string;
  code: string;
  status: string;
  avgCgpa: number;
  domain: string | null;
  lockedAt: string | null;
  leaderId: string;
  members: GroupMemberView[];
  preferenceCount: number;
  titleRegistered: boolean;
  statementWritten: boolean;
  pendingInvites: number;
  guide: string | null;
};

export function NoGroupPanel({ groupSize }: { groupSize: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/groups", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not create group", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `Group ${data.group.code} created`,
        description: "Invite teammates from the Invites screen.",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <EmptyState
          title="You are not in a group yet"
          description={`Create one and invite ${groupSize - 1} teammates, or accept an invite someone has already sent you.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={create} loading={busy}>
                Create a group
              </Button>
              <Link href="/student/invites">
                <Button variant="secondary">View invites</Button>
              </Link>
            </div>
          }
        />
      </CardBody>
    </Card>
  );
}

export function GroupPanel({
  group,
  groupSize,
  prefCount,
  currentStudentId,
}: {
  group: GroupView;
  groupSize: number;
  prefCount: number;
  currentStudentId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busy, setBusy] = useState<"leave" | "submit" | null>(null);

  const isLeader = group.leaderId === currentStudentId;
  const locked = Boolean(group.lockedAt);

  // Mirrors the server-side checks in submitGroup(), so the student can see
  // exactly what is still missing instead of guessing from an error.
  const checklist = [
    {
      label: `Exactly ${groupSize} members`,
      done: group.members.length === groupSize,
      detail: `${group.members.length} of ${groupSize}`,
      href: "/student/invites",
    },
    {
      label: "Domain chosen",
      done: Boolean(group.domain),
      detail: group.domain ?? "not chosen",
      href: "/student/domain",
    },
    {
      label: "Title registered",
      done: group.titleRegistered,
      detail: group.titleRegistered ? "registered" : "not registered",
      href: "/student/domain",
    },
    {
      label: "Problem statement written",
      done: group.statementWritten,
      detail: group.statementWritten ? "written" : "empty",
      href: "/student/domain",
    },
    {
      label: `${prefCount} guide preferences ranked`,
      done: group.preferenceCount === prefCount,
      detail: `${group.preferenceCount} of ${prefCount}`,
      href: "/student/preferences",
    },
  ];
  const ready = checklist.every((item) => item.done);

  async function post(path: string, kind: "leave" | "submit") {
    setBusy(kind);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          tone: "error",
          title: kind === "submit" ? "Cannot submit yet" : "Could not leave",
          description: data.error,
        });
        return;
      }
      toast({
        tone: "success",
        title:
          kind === "submit"
            ? `${group.code} submitted and locked`
            : data.disbanded
              ? "Group disbanded"
              : "You left the group",
      });
      setConfirmLeave(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={group.code}
          subtitle={`${group.domain ?? "No domain chosen"} · ${group.guide ? `Guide: ${group.guide}` : "Guide not allocated"}`}
          actions={
            <>
              <Badge tone={group.members.length === groupSize ? "success" : "warning"}>
                {group.members.length}/{groupSize} members
              </Badge>
              <Badge tone="neutral">Avg CGPA {formatCgpa(group.avgCgpa)}</Badge>
              <Badge tone={locked ? "info" : "neutral"}>
                {locked ? "Locked" : group.status}
              </Badge>
            </>
          }
        />
        <CardBody>
          <DataTable
            rows={group.members}
            rowKey={(row) => row.id}
            columns={[
              { key: "name", header: "Member", render: (row) => row.fullName },
              {
                key: "usn",
                header: "USN",
                render: (row) => <span className="mono">{row.usn}</span>,
              },
              {
                key: "cgpa",
                header: "CGPA",
                numeric: true,
                render: (row) => formatCgpa(row.cgpa),
              },
              {
                key: "role",
                header: "Role",
                render: (row) =>
                  row.role === "LEADER" ? (
                    <Badge tone="info">Leader</Badge>
                  ) : (
                    <Badge tone="neutral">Member</Badge>
                  ),
              },
            ]}
          />
          <p className="text-ink-tertiary mt-3 text-xs">
            Average CGPA is computed from the members above every time the group
            changes — it is not stored by hand.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Submission checklist"
          subtitle={
            locked
              ? "This group has been submitted. Nothing can change until allocation."
              : "All five must be complete before the leader can submit."
          }
          actions={
            !locked &&
            isLeader && (
              <Button
                onClick={() => post(`/api/groups/${group.id}/submit`, "submit")}
                loading={busy === "submit"}
                disabled={!ready}
                icon={<Send className="size-3.5" aria-hidden />}
              >
                Submit &amp; lock
              </Button>
            )
          }
        />
        <CardBody className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className="border-border-subtle flex items-center justify-between gap-3 border px-4 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {item.done ? (
                  <Check className="text-success-ink size-4 shrink-0" aria-hidden />
                ) : (
                  <X className="text-ink-tertiary size-4 shrink-0" aria-hidden />
                )}
                <span className="text-ink truncate text-sm">{item.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span
                  className={
                    item.done
                      ? "text-success-ink text-xs"
                      : "text-ink-secondary text-xs"
                  }
                >
                  {item.detail}
                </span>
                {!item.done && !locked && (
                  <Link
                    href={item.href}
                    className="text-primary rounded text-xs font-medium"
                  >
                    Fix
                  </Link>
                )}
              </span>
            </div>
          ))}

          {!locked && !isLeader && (
            <p className="text-ink-tertiary pt-1 text-xs">
              Only {group.members.find((m) => m.role === "LEADER")?.fullName ?? "the leader"}{" "}
              can submit this group.
            </p>
          )}
        </CardBody>
      </Card>

      {!locked && (
        <Card>
          <CardHeader
            title="Leave this group"
            subtitle={
              group.members.length === 1
                ? "You are the only member, so the group will be disbanded."
                : "Leadership passes to the longest-standing remaining member."
            }
            actions={
              <Button
                variant="danger"
                onClick={() => setConfirmLeave(true)}
                icon={<LogOut className="size-3.5" aria-hidden />}
              >
                Leave group
              </Button>
            }
          />
        </Card>
      )}

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => post(`/api/groups/${group.id}/leave`, "leave")}
        loading={busy === "leave"}
        destructive
        confirmLabel="Leave group"
        title={`Leave ${group.code}?`}
        description={
          group.members.length === 1
            ? "You are the only member, so the group will be deleted."
            : "You will need a fresh invite to rejoin."
        }
      />
    </div>
  );
}
