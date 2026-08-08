import Image from "next/image";
import { cn } from "@/lib/utils";

export const PRODUCT_NAME = "Campus Here";
export const PRODUCT_TAGLINE = "Dept. of CSE · Project Tracking & Allocation";
export const INSTITUTION = "BMS Institute of Technology and Management";

/**
 * The BMSIT lockup. The logo lives at the path the specification names, so
 * dropping the real artwork over `public/assets/bmsit-logo.png` updates the
 * navbar, login screen and hero at once with no code change.
 */
export function Brand({
  size = "md",
  showTagline = true,
  className,
  /** Drop to the mark alone on narrow screens, where the navbar has no room. */
  markOnlyOnMobile = false,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  markOnlyOnMobile?: boolean;
}) {
  const dimension = size === "lg" ? 44 : size === "md" ? 30 : 24;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/assets/bmsit-logo.png"
        alt={INSTITUTION}
        width={dimension}
        height={dimension}
        // Squared off and desaturated to sit inside the palette rather than
        // fight it; the real crest will read the same way.
        className="grayscale contrast-125"
        priority
      />
      <div className={cn("min-w-0", markOnlyOnMobile && "hidden sm:block")}>
        <p
          className={cn(
            "display text-ink truncate leading-none",
            size === "lg" ? "text-2xl" : "text-sm",
          )}
        >
          {PRODUCT_NAME}
        </p>
        {showTagline && (
          <p
            className={cn(
              "label-xs text-ink-tertiary mt-1.5 truncate",
              size === "lg" && "text-[0.75rem]",
            )}
          >
            BMSIT / CSE
          </p>
        )}
      </div>
    </div>
  );
}
