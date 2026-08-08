"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type GuideOption = {
  id: string;
  fullName: string;
  designation: string;
  domains: string[];
  /** Free places this cycle — shown for information, not enforced here. */
  available: number;
  capacity: number;
};

const DESIGNATION_SHORT: Record<string, string> = {
  ASSISTANT_PROFESSOR: "Asst. Prof.",
  ASSOCIATE_PROFESSOR: "Assoc. Prof.",
  PROFESSOR: "Professor",
};

export function PreferencesForm({
  groupId,
  guides,
  prefCount,
  initial,
  locked,
  groupDomain,
}: {
  groupId: string;
  guides: GuideOption[];
  prefCount: number;
  initial: Array<string | null>;
  locked: boolean;
  groupDomain: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [slots, setSlots] = useState<Array<string | null>>(() => {
    const next = Array.from({ length: prefCount }, (_, i) => initial[i] ?? null);
    return next;
  });
  const [saving, setSaving] = useState(false);

  const chosen = slots.filter((id): id is string => Boolean(id));
  const complete = chosen.length === prefCount;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyIds: chosen }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ tone: "error", title: "Could not save", description: data.error });
        return;
      }
      toast({
        tone: "success",
        title: `${prefCount} preferences saved`,
        description: "You can still reorder them until the group is submitted.",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Preference ranking"
        subtitle={`Rank exactly ${prefCount} distinct guides. Choosing one disables it in the other ${prefCount - 1} slots.`}
        actions={
          <>
            <Badge tone={complete ? "success" : "warning"}>
              {chosen.length}/{prefCount} chosen
            </Badge>
            {!locked && (
              <Button
                onClick={save}
                loading={saving}
                disabled={!complete}
                icon={<Save className="size-3.5" aria-hidden />}
              >
                Save preferences
              </Button>
            )}
          </>
        }
      />
      <CardBody className="space-y-3">
        {groupDomain && (
          <p className="text-ink-secondary text-sm">
            Guides whose domains include{" "}
            <span className="text-ink font-medium">{groupDomain}</span> are listed
            first — the allocation engine prefers a domain match.
          </p>
        )}

        {slots.map((selected, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 border px-4 py-3 transition-colors",
              selected ? "border-primary/40 bg-primary-soft/40" : "border-border",
            )}
          >
            <span
              className={cn(
                "mono flex size-7 shrink-0 items-center justify-center border text-xs font-semibold",
                selected
                  ? "bg-primary border-primary text-white"
                  : "border-border-subtle text-ink-tertiary",
              )}
              aria-hidden
            >
              {index + 1}
            </span>
            <label className="sr-only" htmlFor={`pref-${index}`}>
              Preference {index + 1}
            </label>
            <select
              id={`pref-${index}`}
              value={selected ?? ""}
              disabled={locked}
              onChange={(event) => {
                const next = [...slots];
                next[index] = event.target.value || null;
                setSlots(next);
              }}
              className="border-border bg-surface-raised text-ink h-10 w-full border px-3 text-sm disabled:opacity-60"
            >
              <option value="">— Select a guide —</option>
              {guides.map((guide) => {
                // The same guide cannot occupy two ranks. The database enforces
                // this too via @@unique([groupId, facultyId]); disabling the
                // option here just makes the rule visible.
                const takenElsewhere =
                  slots.includes(guide.id) && selected !== guide.id;
                return (
                  <option
                    key={guide.id}
                    value={guide.id}
                    disabled={takenElsewhere}
                  >
                    {guide.fullName} ·{" "}
                    {DESIGNATION_SHORT[guide.designation] ?? guide.designation}
                    {guide.domains.length > 0 && ` · ${guide.domains.join("/")}`}
                    {takenElsewhere ? " (already ranked)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        ))}

        {locked ? (
          <p className="text-ink-secondary text-sm">
            Your group has been submitted, so preferences are locked.
          </p>
        ) : (
          !complete && (
            <p className="text-ink-secondary text-sm">
              Fill all {prefCount} slots to save. You have chosen {chosen.length}.
            </p>
          )
        )}
      </CardBody>
    </Card>
  );
}
