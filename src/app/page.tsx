import type { Metadata } from "next";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingEngine } from "@/components/landing/landing-engine";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFlow } from "@/components/landing/landing-flow";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingRoles } from "@/components/landing/landing-roles";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingThemeShell } from "@/components/landing/landing-theme";

export const metadata: Metadata = {
  title: "Campus Here — BMSIT CSE Project Tracking & Allocation System",
  description:
    "Campus Here takes an academic cohort from CSV upload to final review — group formation, title originality checks, guide allocation, review scheduling and formatted reporting.",
};

export default function HomePage() {
  return (
    <LandingThemeShell>
      <div
        id="landing-root"
        className="min-h-dvh overflow-x-clip bg-[var(--landing-bg)] text-[var(--landing-text)] antialiased selection:bg-[#b9272f] selection:text-white"
      >
        <LandingNav />
        <a href="#features" className="sr-only-focusable">
          Skip to content
        </a>
        <main>
          <LandingHero />
          <LandingStats />
          <LandingFeatures />
          <LandingFlow />
          <LandingEngine />
          <LandingRoles />
          <LandingCta />
        </main>
      </div>
    </LandingThemeShell>
  );
}
