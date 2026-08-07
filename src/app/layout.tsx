import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="bg-bg text-ink min-h-full antialiased">{children}</body>
    </html>
  );
}
