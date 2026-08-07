import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export type Column<T> = {
  key: string;
  header: string;
  /** Right-align and tabular-figure numeric columns. */
  numeric?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

/**
 * Wide tables scroll inside their own container so the page body never
 * scrolls horizontally on a phone.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  className,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={cn(
        "border-border overflow-x-auto rounded-xl border",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "text-ink-secondary px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase whitespace-nowrap",
                  col.numeric && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border-subtle divide-y">
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="hover:bg-surface/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "text-ink px-4 py-3 align-middle",
                    col.numeric && "mono text-right",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
