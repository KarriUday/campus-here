"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type LandingTheme = "light" | "dark";

const LandingThemeContext = createContext<{
  theme: LandingTheme;
  toggleTheme: () => void;
} | null>(null);

export function LandingThemeShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<LandingTheme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("campus-here-landing-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("campus-here-landing-theme", next);
      return next;
    });
  }

  return (
    <LandingThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className="landing-theme"
        data-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const context = useContext(LandingThemeContext);
  if (!context) {
    throw new Error("useLandingTheme must be used inside LandingThemeShell");
  }
  return context;
}
