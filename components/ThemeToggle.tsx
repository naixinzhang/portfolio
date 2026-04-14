"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
    >
      {mounted ? (isDark ? "Light" : "Dark") : "—"}
    </button>
  );
}
