import type { Metadata } from "next";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingEngine } from "@/components/landing/landing-engine";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFlow } from "@/components/landing/landing-flow";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingRoles } from "@/components/landing/landing-roles";
import { LandingStats } from "@/components/landing/landing-stats";

export const metadata: Metadata = {
  description:
    "Campus Here takes an academic cohort from CSV upload to final review — group formation, TF-IDF title originality checks, Gale-Shapley guide allocation, review scheduling and formatted reporting. Dept. of CSE, BMS Institute of Technology and Management.",
};

/**
 * Public landing page.
 *
 * A server component that composes client sections — only the pieces that need
 * scroll listeners ship JavaScript, and the copy itself is server-rendered.
 */
export default function HomePage() {
  return (
    // The gutter lives here so every section below can be an inset colour
    // field, the way the signed-in shell insets its navbar.
    <div
      id="landing-root"
      className="relative min-h-dvh overflow-x-clip px-3 pb-3 sm:px-5 sm:pb-5"
    >
      <LandingNav />
      <a href="#features" className="sr-only-focusable">
        Skip to content
      </a>
      <main className="space-y-3 sm:space-y-5">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingFlow />
        <LandingEngine />
        <LandingRoles />
        <LandingCta />
      </main>
    </div>
  );
}
