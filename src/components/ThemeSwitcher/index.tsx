"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "@/contexts/ThemeContext";

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "midnight", label: "Midnight", icon: "🌌" },
  { value: "sepia", label: "Sepia", icon: "📜" },
  { value: "system", label: "System", icon: "💻" },
];

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTheme = themes.find((t) => t.value === theme);
  const currentIcon = theme === "system"
    ? (resolvedTheme === "dark" || resolvedTheme === "midnight" ? "🌙" : "☀️")
    : currentTheme?.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-sm rounded bg-muted hover:opacity-80 flex items-center gap-1.5 transition-colors"
        title="Change theme"
      >
        <span>{currentIcon}</span>
        <span className="hidden sm:inline">{currentTheme?.label}</span>
        <span className="text-xs opacity-60">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-background border border-border rounded-lg shadow-lg z-50">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                theme === t.value
                  ? "bg-accent/20 text-accent"
                  : "text-foreground"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {theme === t.value && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
