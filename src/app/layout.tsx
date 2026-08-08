import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Inter carries the whole interface, from a 13px table cell to a 110px
 * headline. JetBrains Mono is reserved for codes that must not be misread —
 * USNs and group codes — where a distinct 0/O and 1/l earns its place.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Campus Here — BMSIT CSE",
    template: "%s · Campus Here",
  },
  description:
    "Project Tracking & Allocation System for the Department of Computer Science and Engineering, BMS Institute of Technology and Management.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1e4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`}>
      <body className="bg-bg text-ink min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
