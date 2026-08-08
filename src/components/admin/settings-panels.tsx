"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export type DomainRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  facultyCount: number;
  groupCount: number;
};

export type CapacityRow = {
  id: string;
  designation: "ASSISTANT_PROFESSOR" | "ASSOCIATE_PROFESSOR" | "PROFESSOR";
  maxGroups: number;
};

const DESIGNATION_LABEL: Record<CapacityRow["designation"], string> = {
  ASSISTANT_PROFESSOR: "Assistant Professor",
  ASSOCIATE_PROFESSOR: "Associate Professor",
  PROFESSOR: "Professor",
};

export function DomainSettings({ domains }: { domains: DomainRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addDomain() {
    if (name.trim().length < 2) {
      toast({ tone: "warning", title: "Enter a domain name first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not add domain", description: data.error });
        return;
      }
      toast({ tone: "success", title: `Added ${data.domain.name}` });
      setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(domain: DomainRow) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: { id: domain.id, isActive: !domain.isActive },
      }),
    });
    if (!res.ok) {
      toast({ tone: "error", title: "Could not update that domain." });
      return;
    }
    toast({
      tone: "success",
      title: `${domain.name} ${domain.isActive ? "hidden from" : "shown in"} the student picker`,
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Domains"
        subtitle="Only active domains appear in the student picker. Domains created by a CSV import start inactive."
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            label="New domain"
            placeholder="e.g. Quantum Computing"
            value={name}
            onChange={(event) => setName(event.target.value)}
            wrapperClassName="flex-1 min-w-52"
          />
          <Button
            onClick={addDomain}
            loading={busy}
            icon={<Plus className="size-4" aria-hidden />}
          >
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {domains.map((domain) => (
            <li
              key={domain.id}
              className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-ink text-sm font-medium">
                  {domain.name}{" "}
                  {!domain.isActive && <Badge tone="neutral">Inactive</Badge>}
                </p>
                <p className="text-ink-secondary text-xs">
                  {domain.description ??
                    `${domain.facultyCount} guide(s) · ${domain.groupCount} group(s)`}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggle(domain)}
              >
                {domain.isActive ? "Hide" : "Show"}
              </Button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function CapacitySettings({ rules }: { rules: CapacityRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(rules.map((rule) => [rule.designation, rule.maxGroups])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function save(designation: CapacityRow["designation"], applyToExisting: boolean) {
    setBusy(designation);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capacityRule: {
            designation,
            maxGroups: values[designation],
            applyToExisting,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `${DESIGNATION_LABEL[designation]} cap set to ${values[designation]}`,
        description: applyToExisting
          ? `${data.facultyUpdated ?? 0} guide(s) updated.`
          : "Applies to guides added from now on.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Guide capacity"
        subtitle="Maximum groups a guide may hold in a single cycle. The allocation engine enforces this."
      />
      <CardBody className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="border-border-subtle flex flex-wrap items-end gap-3 border px-4 py-3"
          >
            <div className="min-w-40 flex-1">
              <p className="text-ink text-sm font-medium">
                {DESIGNATION_LABEL[rule.designation]}
              </p>
              <p className="text-ink-secondary text-xs">
                Currently {rule.maxGroups} group(s) per cycle.
              </p>
            </div>
            <Input
              label="Max groups"
              type="number"
              min={1}
              max={10}
              value={values[rule.designation] ?? rule.maxGroups}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [rule.designation]: Number(event.target.value),
                }))
              }
              wrapperClassName="w-28"
            />
            <Button
              size="sm"
              variant="secondary"
              loading={busy === rule.designation}
              onClick={() => save(rule.designation, false)}
            >
              Save default
            </Button>
            <Button
              size="sm"
              loading={busy === rule.designation}
              onClick={() => save(rule.designation, true)}
            >
              Apply to all
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
