"use client";

import { useState } from "react";
import { useGems } from "@/hooks/useGems";
import { useTheme, ALL_THEMES, ColorTheme } from "@/context/ThemeContext";
import { Gem, Sparkles, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

const SPIN_COST = 50;

const GachaPage = () => {
  const router = useRouter();
  const { gems, spendGems } = useGems();
  const { unlockedThemes, unlockTheme, setColorTheme } = useTheme();

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<ColorTheme | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const { addGems } = useGems();

  const lockedThemes = ALL_THEMES.filter((t) => !unlockedThemes.includes(t.id));
  const allUnlocked = lockedThemes.length === 0;

  const handleSpin = () => {
    if (gems < SPIN_COST || allUnlocked) return;

    const success = spendGems(SPIN_COST);
    if (!success) return;

    setSpinning(true);
    setResult(null);

    setTimeout(() => {
      // Pick a random locked theme
      const pick = lockedThemes[Math.floor(Math.random() * lockedThemes.length)];
      const alreadyOwned = unlockedThemes.includes(pick.id);

      if (alreadyOwned) {
        // Consolation refund (shouldn't happen since we filter, but safety net)
        const refund = Math.floor(SPIN_COST * 0.5);
        addGems(refund);
        setIsDuplicate(true);
        setRefundAmount(refund);
      } else {
        unlockTheme(pick.id);
        setIsDuplicate(false);
        setRefundAmount(0);
      }

      setResult(pick.id);
      setSpinning(false);
    }, 1800);
  };

  const resultTheme = ALL_THEMES.find((t) => t.id === result);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-1">Gacha</h1>
        <p className="text-muted-foreground text-sm">Spend gems to unlock new color themes.</p>
        <div className="mt-3 h-px w-12" style={{ background: "var(--theme-gradient)" }} />
      </div>

      {/* Gem balance */}
      <div
        className="flex items-center justify-between rounded-2xl border px-5 py-4 mb-8"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.2)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `rgb(var(--theme-glow) / 0.12)` }}
          >
            <Gem className="w-5 h-5" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Your Balance</p>
            <p className="text-2xl font-black" style={{ color: "var(--theme-badge-text)" }}>
              {gems} <span className="text-sm font-normal text-muted-foreground">gems</span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Each spin costs</p>
          <p className="text-lg font-black" style={{ color: "var(--theme-primary)" }}>💎 {SPIN_COST}</p>
        </div>
      </div>

      {/* Banner / Spin area */}
      <div
        className="rounded-3xl border p-8 mb-8 text-center relative overflow-hidden"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.25)`,
          background: `linear-gradient(135deg, rgb(var(--theme-glow) / 0.08), rgb(var(--theme-glow) / 0.02))`,
        }}
      >
        {/* Decorative glow orbs */}
        <div
          className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }}
        />

        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Theme Banner</p>

        {/* Spin display */}
        <div
          className="w-32 h-32 rounded-3xl mx-auto mb-6 flex items-center justify-center relative transition-all duration-300"
          style={{
            background: spinning
              ? `rgb(var(--theme-glow) / 0.15)`
              : result
              ? `radial-gradient(circle, ${resultTheme?.color}33, ${resultTheme?.color}11)`
              : `rgb(var(--theme-glow) / 0.08)`,
            border: `2px solid ${result && !spinning ? resultTheme?.color + "66" : `rgb(var(--theme-glow) / 0.2)`}`,
            boxShadow: result && !spinning ? `0 0 40px ${resultTheme?.color}33` : "none",
          }}
        >
          {spinning ? (
            <Sparkles
              className="w-12 h-12 animate-spin"
              style={{ color: "var(--theme-primary)" }}
            />
          ) : result && resultTheme ? (
            <div className="space-y-1">
              <div
                className="w-10 h-10 rounded-xl mx-auto"
                style={{ backgroundColor: resultTheme.color }}
              />
              <p className="text-xs font-bold text-foreground">{resultTheme.label}</p>
            </div>
          ) : (
            <Gem className="w-12 h-12 opacity-20" style={{ color: "var(--theme-primary)" }} />
          )}
        </div>

        {/* Result message */}
        {result && !spinning && (
          <div className="mb-6 space-y-2">
            {isDuplicate ? (
              <div>
                <p className="font-bold text-yellow-400">Already owned!</p>
                <p className="text-xs text-muted-foreground">Refunded 💎 {refundAmount} gems as consolation.</p>
              </div>
            ) : (
              <div>
                <p className="font-black text-lg" style={{ color: resultTheme?.color }}>
                  🎉 {resultTheme?.label} Unlocked!
                </p>
                <p className="text-xs text-muted-foreground">New theme added to your collection.</p>
                <button
                  onClick={() => { setColorTheme(result); router.push("/"); }}
                  className="mt-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:brightness-110"
                  style={{
                    backgroundColor: resultTheme?.color + "22",
                    color: resultTheme?.color,
                    border: `1px solid ${resultTheme?.color}44`,
                  }}
                >
                  Apply Theme →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spin button */}
        {allUnlocked ? (
          <div className="py-3 px-6 rounded-xl text-sm text-muted-foreground border"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}>
            🎊 All themes unlocked!
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning || gems < SPIN_COST}
            className="px-8 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 hover:brightness-110 hover:scale-105 active:scale-95"
            style={{
              background: "var(--theme-gradient)",
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            {spinning ? "Spinning..." : `Spin — 💎 ${SPIN_COST} gems`}
          </button>
        )}

        {gems < SPIN_COST && !allUnlocked && (
          <p className="text-xs text-muted-foreground mt-3">
            Need {SPIN_COST - gems} more gems · Complete quizzes or flashcards to earn
          </p>
        )}
      </div>

      {/* Theme collection grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
          Your Collection
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_THEMES.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            return (
              <div
                key={theme.id}
                className="rounded-2xl border p-4 text-center space-y-2 transition-all"
                style={{
                  borderColor: isUnlocked ? `${theme.color}44` : `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: isUnlocked ? `${theme.color}11` : `rgb(var(--theme-glow) / 0.02)`,
                  opacity: isUnlocked ? 1 : 0.5,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl mx-auto flex items-center justify-center"
                  style={{
                    backgroundColor: isUnlocked ? theme.color : "transparent",
                    border: isUnlocked ? "none" : `2px dashed rgb(var(--theme-glow) / 0.3)`,
                  }}
                >
                  {!isUnlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs font-semibold text-foreground/80">
                  {isUnlocked ? theme.label : "???"}
                </p>
                {isUnlocked ? (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${theme.color}22`, color: theme.color }}
                  >
                    Owned
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">Locked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GachaPage;