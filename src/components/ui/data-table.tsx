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
 * A ruled index, not a boxed grid: hairline row rules, uppercase monospaced
 * headers, and a [NN] index column so a long roster reads like a catalogue.
 *
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
  showIndex = true,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  showIndex?: boolean;
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
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-b">
            {showIndex && (
              <th
                scope="col"
                className="label-xs text-ink-tertiary w-12 py-3 pr-3 text-left font-medium"
              >
                №
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "label-xs text-ink-tertiary px-3 py-3 text-left font-medium whitespace-nowrap",
                  col.numeric && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className="border-border-subtle hover:bg-surface border-b transition-colors"
            >
              {showIndex && (
                <td className="index-num py-3 pr-3 align-middle">
                  [{String(index + 1).padStart(2, "0")}]
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "text-ink px-3 py-3 align-middle",
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
