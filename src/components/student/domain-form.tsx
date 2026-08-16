"use client";

import { Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  DuplicateChecker,
  type ExtensionProposal,
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
  const [extensionData, setExtensionData] = useState<ExtensionProposal>({
    isExtension: false,
    proposedInnovations: "",
  });
  const [saving, setSaving] = useState(false);

  const isBlocked = report?.verdict === "BLOCKED";
  // If extension track is selected and innovations are filled out, allow saving!
  const isExtensionValid =
    extensionData.isExtension && extensionData.proposedInnovations.trim().length >= 10;

  const canSave =
    !locked &&
    Boolean(domainId) &&
    title.trim().length >= 3 &&
    (!isBlocked || isExtensionValid);

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
          isExtension: extensionData.isExtension,
          proposedInnovations: extensionData.proposedInnovations.trim() || undefined,
          seniorReferenceId: extensionData.seniorReferenceId,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast({
          tone: "error",
          title: "Title rejected as identical duplicate",
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
        title: extensionData.isExtension
          ? "Extension Track proposal registered!"
          : "Title and problem statement saved!",
        description: extensionData.isExtension
          ? "Your guide will review your novel feature additions and architecture proposal."
          : "Your guide will review your title before Review 0.",
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
                      "cursor-pointer border p-4 transition-colors rounded-xl",
                      selected
                        ? "border-[#28265f] bg-[#f0f0ff]"
                        : "border-[#e2e2e9] hover:border-[#b6b7c4]",
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
                        selected ? "text-[#28265f]" : "text-[#1f2937]",
                      )}
                    >
                      {domain.name}
                    </p>
                    {domain.description && (
                      <p className="text-[#717182] mt-1 text-xs leading-relaxed">
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
          title="Project Title & Originality Checker"
          subtitle="Evaluated live against previous senior projects and institutional repository using Semantic Vector embeddings."
        />
        <CardBody>
          <DuplicateChecker
            value={title}
            onChange={setTitle}
            disabled={locked}
            excludeTitleId={existingTitleId}
            label="Title"
            onReport={setReport}
            onExtensionChange={setExtensionData}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Problem Statement & Scope"
          subtitle="What problem are you solving, and how? Your guide reviews this at Review 0."
          actions={
            !locked && (
              <Button
                onClick={save}
                loading={saving}
                disabled={!canSave}
                icon={<Save className="size-3.5" aria-hidden />}
              >
                {extensionData.isExtension ? "Submit Extension Proposal" : "Save Title & Statement"}
              </Button>
            )
          }
        />
        <CardBody className="space-y-3">
          <Textarea
            label="Problem Statement"
            value={statement}
            disabled={locked}
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Describe the engineering problem, your proposed methodology, and how your team will evaluate performance..."
            className="min-h-36"
            hint={`${statement.trim().length} characters`}
          />

          {isBlocked && !isExtensionValid && (
            <p className="rounded-lg bg-[#fff4f4] border border-[#f0c7ca] px-3 py-2 text-xs text-[#9f242b]">
              Direct saving is disabled while title has ≥ 95% similarity. To proceed, either differentiate your title or apply under the <strong>Extension & Innovation Track</strong> with your novel feature additions.
            </p>
          )}
          {isExtensionValid && (
            <p className="rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-2 text-xs text-[#16a34a] flex items-center gap-1.5">
              <Sparkles className="size-4" />
              <strong>Extension Track Active:</strong> Your team will be evaluated based on the proposed novel features and architectural delta.
            </p>
          )}
          {!isBlocked && !domainId && !locked && (
            <p className="text-xs text-[#717182]">
              Choose a domain before saving.
            </p>
          )}
          {locked && (
            <p className="text-xs text-[#717182]">
              Your group has been submitted, so the title and statement can no longer be edited.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
