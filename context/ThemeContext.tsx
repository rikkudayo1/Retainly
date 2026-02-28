"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/db";

export const ALL_THEMES = [
  { id: "blue", label: "Ocean Blue", color: "#3b82f6", unlocked: true },
  { id: "purple", label: "Royal Purple", color: "#a855f7", unlocked: true },
  { id: "luxury", label: "Luxury Gold", color: "#f59e0b", unlocked: true },
  { id: "forest", label: "Forest", color: "#22c55e", unlocked: false },
  { id: "sunset", label: "Sunset", color: "#f97316", unlocked: false },
  { id: "rose", label: "Rose", color: "#ec4899", unlocked: false },
  { id: "midnight", label: "Midnight", color: "#6366f1", unlocked: false },
  { id: "crimson", label: "Crimson", color: "#ef4444", unlocked: false },
] as const;

export type ColorTheme = (typeof ALL_THEMES)[number]["id"];
export type StyleMode = "default" | "pixel";
type Mode = "light" | "dark";

export const ALL_STYLES: { id: StyleMode; label: string; description: string; emoji: string }[] = [
  { id: "default", label: "Default", description: "Clean and minimal", emoji: "✦" },
  { id: "pixel", label: "Pixel", description: "Retro 8-bit arcade style", emoji: "▶" },
];

const THEME_VARS: Record<ColorTheme, Record<string, string>> = {
  blue: {
    "--theme-primary": "#3b82f6",
    "--theme-primary-light": "#bfdbfe",
    "--theme-glow": "59 130 246",
    "--theme-border": "30 58 138",
    "--theme-accent-bg": "30 58 138",
    "--theme-badge-text": "#93c5fd",
    "--theme-gradient": "linear-gradient(135deg, #2563eb, #38bdf8, #1d4ed8)",
    "--theme-button-text": "#ffffff",
  },
  purple: {
    "--theme-primary": "#a855f7",
    "--theme-primary-light": "#e9d5ff",
    "--theme-glow": "168 85 247",
    "--theme-border": "88 28 135",
    "--theme-accent-bg": "88 28 135",
    "--theme-badge-text": "#d8b4fe",
    "--theme-gradient": "linear-gradient(135deg, #7c3aed, #a855f7, #6d28d9)",
    "--theme-button-text": "#ffffff",
  },
  luxury: {
    "--theme-primary": "#f59e0b",
    "--theme-primary-light": "#fde68a",
    "--theme-glow": "251 191 36",
    "--theme-border": "120 53 15",
    "--theme-accent-bg": "120 53 15",
    "--theme-badge-text": "#fcd34d",
    "--theme-gradient": "linear-gradient(135deg, #d97706, #f59e0b, #b45309)",
    "--theme-button-text": "#ffffff",
  },
  forest: {
    "--theme-primary": "#22c55e",
    "--theme-primary-light": "#bbf7d0",
    "--theme-glow": "34 197 94",
    "--theme-border": "20 83 45",
    "--theme-accent-bg": "20 83 45",
    "--theme-badge-text": "#86efac",
    "--theme-gradient": "linear-gradient(135deg, #16a34a, #22c55e, #15803d)",
    "--theme-button-text": "#ffffff",
  },
  sunset: {
    "--theme-primary": "#f97316",
    "--theme-primary-light": "#fed7aa",
    "--theme-glow": "249 115 22",
    "--theme-border": "124 45 18",
    "--theme-accent-bg": "124 45 18",
    "--theme-badge-text": "#fdba74",
    "--theme-gradient": "linear-gradient(135deg, #ea580c, #f97316, #c2410c)",
    "--theme-button-text": "#ffffff",
  },
  rose: {
    "--theme-primary": "#ec4899",
    "--theme-primary-light": "#fbcfe8",
    "--theme-glow": "236 72 153",
    "--theme-border": "131 24 67",
    "--theme-accent-bg": "131 24 67",
    "--theme-badge-text": "#f9a8d4",
    "--theme-gradient": "linear-gradient(135deg, #db2777, #ec4899, #be185d)",
    "--theme-button-text": "#ffffff",
  },
  midnight: {
    "--theme-primary": "#6366f1",
    "--theme-primary-light": "#e0e7ff",
    "--theme-glow": "99 102 241",
    "--theme-border": "49 46 129",
    "--theme-accent-bg": "49 46 129",
    "--theme-badge-text": "#a5b4fc",
    "--theme-gradient": "linear-gradient(135deg, #4f46e5, #6366f1, #4338ca)",
    "--theme-button-text": "#ffffff",
  },
  crimson: {
    "--theme-primary": "#ef4444",
    "--theme-primary-light": "#fecaca",
    "--theme-glow": "239 68 68",
    "--theme-border": "127 29 29",
    "--theme-accent-bg": "127 29 29",
    "--theme-badge-text": "#fca5a5",
    "--theme-gradient": "linear-gradient(135deg, #dc2626, #ef4444, #b91c1c)",
    "--theme-button-text": "#ffffff",
  },
};

interface ThemeContextType {
  colorTheme: ColorTheme;
  mode: Mode;
  styleMode: StyleMode;
  unlockedThemes: ColorTheme[];
  setColorTheme: (t: ColorTheme) => void;
  toggleMode: () => void;
  setStyleMode: (s: StyleMode) => void;
  unlockTheme: (t: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: "blue",
  mode: "dark",
  styleMode: "default",
  unlockedThemes: ["blue", "purple", "luxury"],
  setColorTheme: () => {},
  toggleMode: () => {},
  setStyleMode: () => {},
  unlockTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("blue");
  const [mode, setMode] = useState<Mode>("dark");
  const [styleMode, setStyleModeState] = useState<StyleMode>("default");
  const [unlockedThemes, setUnlockedThemes] = useState<ColorTheme[]>([
    "blue",
    "purple",
    "luxury",
  ]);

  useEffect(() => {
    getProfile().then((profile) => {
      if (!profile) return;
      if (profile.color_theme)
        setColorThemeState(profile.color_theme as ColorTheme);
      if (profile.mode) setMode(profile.mode as Mode);
      if (profile.style_mode) setStyleModeState(profile.style_mode as StyleMode);
      if (profile.unlocked_themes)
        setUnlockedThemes(profile.unlocked_themes as ColorTheme[]);
    });
  }, []);

  // Apply color theme + dark mode
  useEffect(() => {
    const root = document.documentElement;

    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const vars = THEME_VARS[colorTheme];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [colorTheme, mode]);

  // Apply style mode as data attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-style", styleMode);
  }, [styleMode]);

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t);
    updateProfile({ color_theme: t });
  };

  const toggleMode = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    updateProfile({ mode: next });
  };

  const setStyleMode = (s: StyleMode) => {
    setStyleModeState(s);
    updateProfile({ style_mode: s });
  };

  const unlockTheme = (t: ColorTheme) => {
    if (unlockedThemes.includes(t)) return;
    const updated = [...unlockedThemes, t];
    setUnlockedThemes(updated);
    updateProfile({ unlocked_themes: updated });
  };

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        mode,
        styleMode,
        unlockedThemes,
        setColorTheme,
        toggleMode,
        setStyleMode,
        unlockTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};