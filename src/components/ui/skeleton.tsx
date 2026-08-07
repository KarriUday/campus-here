import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("skeleton rounded-lg", className)}
      aria-hidden
      data-testid="skeleton"
    />
  );
}

/** Placeholder for a table that is still loading. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border-border space-y-px overflow-hidden rounded-xl border">
      <Skeleton className="h-10 rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-none opacity-60" />
      ))}
    </div>
  );
}
