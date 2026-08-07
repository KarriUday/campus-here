import Image from "next/image";
import { cn } from "@/lib/utils";

export const PRODUCT_NAME = "Campus Here";
export const PRODUCT_TAGLINE = "Dept. of CSE · Project Tracking & Allocation";
export const INSTITUTION = "BMS Institute of Technology and Management";

/**
 * The BMSIT lockup. The logo lives at the path the specification names, so
 * dropping the real artwork over `public/assets/bmsit-logo.png` updates the
 * navbar, login screen and admin hero at once with no code change.
 */
export function Brand({
  size = "md",
  showTagline = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}) {
  const dimension = size === "lg" ? 56 : size === "md" ? 36 : 28;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/assets/bmsit-logo.png"
        alt={INSTITUTION}
        width={dimension}
        height={dimension}
        className="rounded-lg"
        priority
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-ink leading-tight font-semibold tracking-tight",
            size === "lg" ? "text-xl" : "text-sm",
          )}
        >
          {PRODUCT_NAME}
        </p>
        {showTagline && (
          <p
            className={cn(
              "text-ink-secondary truncate leading-tight",
              size === "lg" ? "text-sm" : "text-xs",
            )}
          >
            {PRODUCT_TAGLINE}
          </p>
        )}
      </div>
    </div>
  );
}
