"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type PendingTitle = {
  id: string;
  groupCode: string;
  title: string;
  problemStatement: string | null;
  domain: string | null;
  approvalStatus: string;
  similarityScore: number | null;
  bestMatch: string | null;
  sharedTerms: string[];
};

function scoreTone(score: number | null) {
  if (score === null) return "neutral" as const;
  if (score >= 0.95) return "error" as const;
  if (score >= 0.8) return "warning" as const;
  return "success" as const;
}

export function TitleApprovals({ titles }: { titles: PendingTitle[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function review(id: string, decision: "APPROVE" | "REJECT") {
    setBusy(`${id}:${decision}`);
    try {
      const res = await fetch(`/api/titles/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reasons[id] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: decision === "APPROVE" ? "success" : "info",
        title:
          decision === "APPROVE"
            ? `Approved: ${data.title.title}`
            : "Sent back to the group",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (titles.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="Nothing awaiting approval"
            description="Titles your groups submit appear here with their originality score."
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {titles.map((title) => (
        <Card key={title.id}>
          <CardHeader
            title={title.title}
            subtitle={`${title.groupCode} · ${title.domain ?? "no domain"}`}
            actions={
              <>
                <Badge tone={scoreTone(title.similarityScore)}>
                  {title.similarityScore === null
                    ? "Not scored"
                    : `${Math.round(title.similarityScore * 100)}% similar`}
                </Badge>
                <Badge
                  tone={title.approvalStatus === "APPROVED" ? "success" : "neutral"}
                >
                  {title.approvalStatus}
                </Badge>
              </>
            }
          />
          <CardBody className="space-y-3">
            {title.problemStatement && (
              <p className="text-ink-secondary border-primary border-l-2 pl-4 py-1 text-sm leading-relaxed">
                {title.problemStatement}
              </p>
            )}

            {title.bestMatch && (
              <p className="text-ink-secondary text-sm">
                Closest existing title:{" "}
                <span className="text-ink font-medium">{title.bestMatch}</span>
                {title.sharedTerms.length > 0 && (
                  <>
                    {" "}
                    — shared words:{" "}
                    {title.sharedTerms.map((term) => (
                      <span
                        key={term}
                        className="bg-primary-soft text-primary mono mr-1 inline-block rounded px-1.5 py-0.5 text-xs"
                      >
                        {term}
                      </span>
                    ))}
                  </>
                )}
              </p>
            )}

            <Textarea
              label="Reason (required to send back)"
              value={reasons[title.id] ?? ""}
              onChange={(event) =>
                setReasons((current) => ({
                  ...current,
                  [title.id]: event.target.value,
                }))
              }
              placeholder="What the group must change."
              className="min-h-20"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                loading={busy === `${title.id}:APPROVE`}
                onClick={() => review(title.id, "APPROVE")}
              >
                Approve &amp; register
              </Button>
              <Button
                variant="secondary"
                loading={busy === `${title.id}:REJECT`}
                onClick={() => review(title.id, "REJECT")}
              >
                Send back
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
