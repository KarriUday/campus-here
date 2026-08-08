import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton", className)} aria-hidden data-testid="skeleton" />
  );
}

/** Placeholder for a table that is still loading. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border-border-subtle space-y-px border-t">
      <Skeleton className="h-10" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 opacity-60" />
      ))}
    </div>
  );
}
