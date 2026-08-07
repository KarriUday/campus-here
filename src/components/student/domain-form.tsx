"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  DuplicateChecker,
  type SimilarityReport,
} from "@/components/titles/duplicate-checker";
import { cn } from "@/lib/utils";

export type DomainOption = {
  id: string;
  name: string;
  description: string | null;
};

export function DomainForm({
  groupId,
  domains,
  initialDomainId,
  initialTitle,
  initialStatement,
  existingTitleId,
  locked,
}: {
  groupId: string;
  domains: DomainOption[];
  initialDomainId: string | null;
  initialTitle: string;
  initialStatement: string;
  existingTitleId?: string;
  locked: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [domainId, setDomainId] = useState(initialDomainId);
  const [title, setTitle] = useState(initialTitle);
  const [statement, setStatement] = useState(initialStatement);
  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [saving, setSaving] = useState(false);

  const blocked = report?.verdict === "BLOCKED";
  const canSave =
    !locked && Boolean(domainId) && title.trim().length >= 3 && !blocked;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title: title.trim(),
          problemStatement: statement.trim() || undefined,
          domainId: domainId ?? undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        // The server re-ran the check; the client score is never what decides.
        toast({
          tone: "error",
          title: "Title rejected as a duplicate",
          description: data.error,
        });
        if (data.report) setReport(data.report);
        return;
      }
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }

      toast({
        tone: "success",
        title: "Title and statement saved",
        description: "Your guide will review it before approval.",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Domain"
          subtitle="Pick the cluster your project belongs to. Guide preferences are ranked within it."
          actions={locked ? <Badge tone="info">Locked</Badge> : undefined}
        />
        <CardBody>
          <fieldset disabled={locked}>
            <legend className="sr-only">Project domain</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domains.map((domain) => {
                const selected = domain.id === domainId;
                return (
                  <label
                    key={domain.id}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-colors",
                      selected
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:border-ink-tertiary",
                      locked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="domain"
                      value={domain.id}
                      checked={selected}
                      onChange={() => setDomainId(domain.id)}
                      className="sr-only"
                    />
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        selected ? "text-primary" : "text-ink",
                      )}
                    >
                      {domain.name}
                    </p>
                    {domain.description && (
                      <p className="text-ink-secondary mt-1 text-xs leading-relaxed">
                        {domain.description}
                      </p>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Project title"
          subtitle="Checked against every registered and previously imported title as you type."
        />
        <CardBody>
          <DuplicateChecker
            value={title}
            onChange={setTitle}
            disabled={locked}
            excludeTitleId={existingTitleId}
            label="Title"
            onReport={setReport}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Problem statement"
          subtitle="What problem are you solving, and how? Your guide reads this at Review 0."
          actions={
            !locked && (
              <Button
                onClick={save}
                loading={saving}
                disabled={!canSave}
                icon={<Save className="size-3.5" aria-hidden />}
              >
                Save
              </Button>
            )
          }
        />
        <CardBody className="space-y-3">
          <Textarea
            label="Statement"
            value={statement}
            disabled={locked}
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Describe the problem, your proposed approach, and how you will evaluate it."
            className="min-h-36"
            hint={`${statement.trim().length} characters`}
          />

          {blocked && (
            <p className="bg-error-soft text-error-ink rounded-lg px-3 py-2 text-sm">
              Saving is disabled while the title scores 95% or above. Change the
              title to something distinct from the match shown above.
            </p>
          )}
          {!blocked && !domainId && !locked && (
            <p className="text-ink-secondary text-sm">
              Choose a domain before saving.
            </p>
          )}
          {locked && (
            <p className="text-ink-secondary text-sm">
              Your group has been submitted, so the title and statement can no
              longer be edited.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
