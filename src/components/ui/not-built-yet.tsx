import { Hammer } from "lucide-react";
import { Card, CardBody } from "./card";

/**
 * Placeholder for a route whose backend lands in a later build phase.
 *
 * It states plainly that nothing is wired yet rather than rendering
 * convincing-looking sample data — a screen that appears to work but writes
 * nowhere is exactly what this rebuild exists to replace.
 */
export function NotBuiltYet({ phase, summary }: { phase: string; summary: string }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-3">
        <span className="label-xs border-ink text-ink inline-flex items-center gap-2 border px-3 py-1.5">
          <Hammer className="size-3.5" aria-hidden />
          Not implemented yet · {phase}
        </span>
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed">
          {summary}
        </p>
        <p className="text-ink-tertiary text-xs">
          This screen is intentionally empty. No sample data is shown here,
          because nothing on it would write to the database yet.
        </p>
      </CardBody>
    </Card>
  );
}
