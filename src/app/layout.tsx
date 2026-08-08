import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Archivo is a grotesque with a wide weight range — it sets comfortably at
 * 13px in a table and still holds up at 120px in uppercase display.
 * JetBrains Mono carries every numeral, index and micro-label.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#f2f0ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable} h-full`}>
      <body className="bg-bg text-ink grain min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
