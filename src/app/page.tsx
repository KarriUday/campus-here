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
  title: "Campus Here — BMSIT CSE Project Tracking & Allocation System",
  description:
    "Campus Here takes an academic cohort from CSV upload to final review — group formation, TF-IDF title originality checks, Gale-Shapley guide allocation, review scheduling and formatted reporting. Dept. of CSE, BMS Institute of Technology and Management.",
};

/**
 * Public landing page.
 * Styled in the BMSIT Royal Indigo & Sapphire palette matching the official gear seal emblem.
 */
export default function HomePage() {
  return (
    <div
      id="landing-root"
      className="relative min-h-dvh overflow-x-clip bg-[#0A0D1B] text-[#E4E7F4] selection:bg-[#4B63F6]/30 selection:text-indigo-200 px-3 pb-3 sm:px-6 sm:pb-6 font-sans antialiased"
    >
      {/* Background Subtle Radial Glowing Auras matching BMSIT colors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#384294]/30 via-[#5C68A6]/15 to-transparent blur-[130px] rounded-full opacity-80" />
        <div className="absolute top-[40%] -left-[10%] w-[650px] h-[650px] bg-[#4B63F6]/15 blur-[150px] rounded-full" />
        <div className="absolute top-[70%] -right-[10%] w-[650px] h-[650px] bg-[#2C3373]/25 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <LandingNav />
        <a href="#features" className="sr-only-focusable">
          Skip to content
        </a>
        <main className="space-y-6 sm:space-y-8">
          <LandingHero />
          <LandingStats />
          <LandingFeatures />
          <LandingFlow />
          <LandingEngine />
          <LandingRoles />
          <LandingCta />
        </main>
      </div>
    </div>
  );
}
