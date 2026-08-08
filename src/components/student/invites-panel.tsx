"use client";

import { Search, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatCgpa } from "@/lib/utils";

type AvailableStudent = {
  id: string;
  usn: string;
  fullName: string;
  cgpa: number;
};

export type IncomingInvite = {
  id: string;
  status: string;
  expiresAt: string;
  from: { fullName: string; usn: string };
  group: {
    code: string;
    members: number;
    avgCgpa: string;
    domain: string | null;
  };
};

function expiryLabel(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

/** Search the unattached pool and invite. Only shown to students in a group. */
export function InviteSearch({
  groupId,
  seatsLeft,
}: {
  groupId: string;
  seatsLeft: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/students/available?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        if (id !== requestId.current) return;
        setStudents(res.ok ? data.students : []);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function invite(student: AvailableStudent) {
    setInviting(student.id);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: student.usn }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Invite not sent", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `Invite sent to ${student.fullName}`,
        description: "They have 3 days to respond.",
      });
      setStudents((current) => current.filter((s) => s.id !== student.id));
      router.refresh();
    } finally {
      setInviting(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Find teammates"
        subtitle="Students in this cycle who are not yet in a group."
        actions={
          <Badge tone={seatsLeft > 0 ? "info" : "warning"}>
            {seatsLeft > 0
              ? `${seatsLeft} place${seatsLeft === 1 ? "" : "s"} left`
              : "All places committed"}
          </Badge>
        }
      />
      <CardBody className="space-y-3">
        <div className="relative">
          <Search
            className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or USN…"
            aria-label="Search available students"
            className="border-border bg-surface-raised text-ink placeholder:text-ink-tertiary h-10 w-full border pr-3 pl-9 text-sm"
          />
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {loading && students.length === 0 && (
            <p className="text-ink-secondary py-4 text-center text-sm">Searching…</p>
          )}
          {!loading && students.length === 0 && (
            <EmptyState
              title="No students available"
              description={
                query
                  ? "Nobody unattached matches that search."
                  : "Everyone in this cycle is already in a group."
              }
            />
          )}
          {students.map((student) => (
            <div
              key={student.id}
              className="border-border-subtle flex items-center justify-between gap-3 border px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">
                  {student.fullName}
                </p>
                <p className="text-ink-secondary text-xs">
                  <span className="mono">{student.usn}</span> · CGPA{" "}
                  {formatCgpa(student.cgpa)}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={seatsLeft <= 0}
                loading={inviting === student.id}
                onClick={() => invite(student)}
                icon={<UserPlus className="size-3.5" aria-hidden />}
              >
                Invite
              </Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function IncomingInvites({ invites }: { invites: IncomingInvite[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = invites.filter((invite) => invite.status === "PENDING");
  const resolved = invites.filter((invite) => invite.status !== "PENDING");

  async function respond(invite: IncomingInvite, action: "accept" | "reject") {
    setBusy(`${invite.id}:${action}`);
    try {
      const res = await fetch(`/api/invites/${invite.id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not respond", description: data.error });
        return;
      }
      if (action === "accept") {
        toast({
          tone: "success",
          title: `You joined ${invite.group.code}`,
          description:
            data.autoRejected > 0
              ? `Your ${data.autoRejected} other pending invite(s) were declined automatically.`
              : undefined,
        });
      } else {
        toast({ tone: "info", title: `Declined ${invite.group.code}` });
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Incoming invites"
        subtitle="Accepting one automatically declines the rest."
      />
      <CardBody className="space-y-3">
        {pending.length === 0 ? (
          <EmptyState
            title="No pending invites"
            description="Invites other groups send you appear here."
          />
        ) : (
          pending.map((invite) => (
            <div
              key={invite.id}
              className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-ink text-sm font-medium">
                  <span className="mono">{invite.group.code}</span> ·{" "}
                  {invite.group.domain ?? "no domain yet"}
                </p>
                <p className="text-ink-secondary text-xs">
                  From {invite.from.fullName} · {invite.group.members} member(s) ·
                  avg CGPA {invite.group.avgCgpa} · expires{" "}
                  {expiryLabel(invite.expiresAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={busy === `${invite.id}:accept`}
                  onClick={() => respond(invite, "accept")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy === `${invite.id}:reject`}
                  onClick={() => respond(invite, "reject")}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))
        )}

        {resolved.length > 0 && (
          <div className="pt-2">
            <p className="text-ink-tertiary mb-2 text-xs font-semibold tracking-wide uppercase">
              Previously
            </p>
            {resolved.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 px-1 py-1.5"
              >
                <span className="text-ink-secondary text-sm">
                  <span className="mono">{invite.group.code}</span> from{" "}
                  {invite.from.fullName}
                </span>
                <Badge
                  tone={invite.status === "ACCEPTED" ? "success" : "neutral"}
                >
                  {invite.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
