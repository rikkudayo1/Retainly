"use client";

import { useTheme, ALL_THEMES } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Moon, Lock } from "lucide-react";
import { useState } from "react";

const ThemeToggle = () => {
  const { colorTheme, mode, unlockedThemes, setColorTheme, toggleMode } =
    useTheme();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Panel */}
      {open && (
        <div className="bg-background/90 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl space-y-4 w-52">
          {/* Color themes */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Theme
            </p>
            <div className="space-y-1">
              {ALL_THEMES.map((theme) => {
                const isUnlocked = unlockedThemes.includes(theme.id);
                const isActive = colorTheme === theme.id;

                return (
                  <button
                    key={theme.id}
                    onClick={() => isUnlocked && setColorTheme(theme.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      !isUnlocked
                        ? "opacity-40 cursor-not-allowed"
                        : isActive
                          ? "bg-muted font-semibold"
                          : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {/* Color dot */}
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background ${
                        isActive ? "ring-white/40" : "ring-transparent"
                      }`}
                      style={{ backgroundColor: theme.color }}
                    />

                    <span className="flex-1 text-left">{theme.label}</span>

                    {/* Right side indicator */}
                    {!isUnlocked ? (
                      <Lock className="w-3 h-3 opacity-60" />
                    ) : isActive ? (
                      <span className="text-xs">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Light / Dark */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Mode
            </p>
            <button
              onClick={toggleMode}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted/50 transition-all"
            >
              {mode === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="h-px bg-border" />

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              {t("theme.language")}
            </p>
            <div className="flex gap-2">
              {(["en", "th"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={
                    lang === l
                      ? {
                          background: "var(--theme-primary)",
                          color: "#fff",
                          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }
                      : {
                          backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                          color: "var(--muted-foreground)",
                          border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                        }
                  }
                >
                  {l === "en" ? "🇬🇧 EN" : "🇹🇭 TH"}
                </button>
              ))}
            </div>
          </div>

          {/* Gacha hint */}
          <div
            className="rounded-xl px-3 py-2 text-xs text-center"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
              color: "var(--theme-badge-text)",
            }}
          >
            💎 Earn gems to unlock more themes
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-12 h-12 rounded-full border border-border bg-background/90 backdrop-blur-md shadow-xl flex items-center justify-center hover:scale-105 transition-all"
        style={{ color: "var(--theme-primary)" }}
      >
        {open ? (
          <span className="text-lg">✕</span>
        ) : (
          <span className="text-lg">🎨</span>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
