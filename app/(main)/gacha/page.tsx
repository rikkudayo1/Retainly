"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme, ALL_THEMES, ColorTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Gem, Lock, Zap, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGemsContext } from "@/context/GemsContext";

const SPIN_COST = 50;

// ── Arknights-style rarity tiers based on theme position ───────
const getRarity = (index: number) => {
  if (index < 2) return { stars: 6, color: "#FFB800", label: "★★★★★★" };
  if (index < 5) return { stars: 5, color: "#E8924E", label: "★★★★★" };
  return { stars: 4, color: "#9B8FD4", label: "★★★★" };
};

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div
      className="flex-1 h-px"
      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }}
    />
  </div>
);

// ── Full-screen reveal overlay ──────────────────────────────────
const BannerReveal = ({
  theme,
  isDuplicate,
  refundAmount,
  onClose,
  onApply,
}: {
  theme: (typeof ALL_THEMES)[number];
  isDuplicate: boolean;
  refundAmount: number;
  onClose: () => void;
  onApply: () => void;
}) => {
  const [phase, setPhase] = useState<"flash" | "slide" | "show">("flash");
  const rarity = getRarity(ALL_THEMES.findIndex((t) => t.id === theme.id));

  useEffect(() => {
    // flash → slide → show
    const t1 = setTimeout(() => setPhase("slide"), 350);
    const t2 = setTimeout(() => setPhase("show"), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes flashIn {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          40%  { opacity: 0.3; }
          60%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px) skewY(1deg); }
          to   { opacity: 1; transform: translateY(0) skewY(0deg); }
        }
        @keyframes cardSlam {
          0%   { opacity: 0; transform: translateY(-40px) scale(1.1) rotate(-1deg); filter: brightness(2); }
          40%  { opacity: 1; transform: translateY(6px) scale(0.97) rotate(0.3deg); filter: brightness(1.3); }
          70%  { transform: translateY(-3px) scale(1.01) rotate(0deg); filter: brightness(1); }
          100% { transform: translateY(0) scale(1) rotate(0deg); filter: brightness(1); }
        }
        @keyframes starsFall {
          0%   { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanReveal {
          from { clip-path: inset(0 0 100% 0); }
          to   { clip-path: inset(0 0 0% 0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes lineExpand {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes particleDrift {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-120px) translateX(var(--drift-x)) scale(0); opacity: 0; }
        }

        .overlay-bg   { animation: overlayIn 0.2s ease forwards; }
        .phase-flash  { animation: flashIn 0.35s ease forwards; }
        .card-slam    { animation: cardSlam 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
        .stars-fall   { animation: starsFall 0.4s ease forwards; }
        .scan-reveal  { animation: scanReveal 0.5s ease forwards; }
        .glow-pulse   { animation: glowPulse 2s ease-in-out infinite; }
        .slide-up     { animation: slideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .line-expand  { animation: lineExpand 0.6s ease forwards; }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: particleDrift 1.2s ease forwards;
        }
      `}</style>

      {/* Dark overlay */}
      <div
        className="overlay-bg fixed inset-0 z-[999] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Background panel — Arknights-style diagonal slash */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Diagonal accent stripe */}
          <div
            className="absolute"
            style={{
              left: "-10%",
              top: "20%",
              width: "120%",
              height: "60%",
              background: `linear-gradient(105deg, transparent 35%, ${rarity.color}08 35%, ${rarity.color}08 65%, transparent 65%)`,
            }}
          />
          {/* Horizontal scan lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{
                top: `${i * 5}%`,
                height: "1px",
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}
            />
          ))}
          {/* Corner marks */}
          {[
            { pos: "top-6 left-6", bracket: "┌" },
            { pos: "top-6 right-6", bracket: "┐" },
            { pos: "bottom-6 left-6", bracket: "└" },
            { pos: "bottom-6 right-6", bracket: "┘" },
          ].map(({ pos, bracket }) => (
            <div
              key={pos}
              className={`absolute ${pos} font-mono text-2xl`}
              style={{ color: `${rarity.color}66` }}
            >
              {bracket}
            </div>
          ))}
          {/* Glow orb behind card */}
          <div
            className="glow-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: 480,
              height: 480,
              background: `radial-gradient(circle, ${rarity.color}18 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition-all hover:brightness-110"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.2)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
            color: `rgb(var(--theme-glow) / 0.6)`,
          }}
        >
          <X className="w-3.5 h-3.5" /> ESC
        </button>

        {/* Flash overlay on phase=flash */}
        {phase === "flash" && (
          <div
            className="phase-flash absolute inset-0 pointer-events-none"
            style={{ backgroundColor: rarity.color, mixBlendMode: "screen" }}
          />
        )}

        {/* Main card content */}
        {phase !== "flash" && (
          <div className="relative flex flex-col items-center gap-6 px-6 max-w-sm w-full">
            {/* Rarity stars */}
            <div
              className="stars-fall font-mono text-2xl tracking-widest"
              style={{
                color: rarity.color,
                animationDelay: "0.1s",
                opacity: 0,
              }}
            >
              {rarity.label}
            </div>

            {/* The theme card — Arknights operator card style */}
            <div
              className={`card-slam relative w-64 overflow-hidden`}
              style={{
                borderRadius: "4px",
                border: `2px solid ${rarity.color}88`,
                boxShadow: `0 0 40px ${rarity.color}44, inset 0 0 40px ${rarity.color}08`,
              }}
            >
              {/* Card top bar */}
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ backgroundColor: rarity.color }}
              >
                <span className="font-mono text-[10px] tracking-[0.2em] text-black font-bold">
                  THEME_UNLOCK
                </span>
                <span className="font-mono text-[10px] text-black font-bold">
                  {isDuplicate ? "DUPLICATE" : "NEW"}
                </span>
              </div>

              {/* Card body */}
              <div
                className="relative p-6 flex flex-col items-center gap-4"
                style={{ backgroundColor: "#0a0a0f" }}
              >
                {/* Geometric background pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, ${rarity.color}22 0px, ${rarity.color}22 1px, transparent 1px, transparent 12px)`,
                    }}
                  />
                </div>

                {/* Color swatch — the "operator portrait" */}
                <div
                  className="relative w-24 h-24 rounded-sm"
                  style={{
                    backgroundColor: theme.color,
                    boxShadow: `0 0 40px ${theme.color}88`,
                  }}
                >
                  {/* Scan reveal effect */}
                  <div
                    className="scan-reveal absolute inset-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  {/* Corner accents */}
                  <div
                    className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2"
                    style={{ borderColor: "#fff" }}
                  />
                  <div
                    className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2"
                    style={{ borderColor: "#fff" }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2"
                    style={{ borderColor: "#fff" }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2"
                    style={{ borderColor: "#fff" }}
                  />
                </div>

                {/* Theme name */}
                <div className="text-center relative z-10">
                  <p className="font-black text-xl text-white tracking-wide">
                    {theme.label}
                  </p>
                  <div
                    className="line-expand h-0.5 mt-1 mx-auto"
                    style={{
                      backgroundColor: rarity.color,
                      animationDelay: "0.3s",
                    }}
                  />
                </div>

                {/* Duplicate / new badge */}
                {isDuplicate ? (
                  <div
                    className="w-full px-3 py-2 rounded text-center font-mono text-xs"
                    style={{
                      backgroundColor: "rgb(234 179 8 / 0.12)",
                      border: "1px solid rgb(234 179 8 / 0.3)",
                      color: "#eab308",
                    }}
                  >
                    💎 +{refundAmount} gems returned
                  </div>
                ) : (
                  <div
                    className="w-full px-3 py-2 rounded text-center font-mono text-xs"
                    style={{
                      backgroundColor: "rgb(34 197 94 / 0.1)",
                      border: "1px solid rgb(34 197 94 / 0.3)",
                      color: "#22c55e",
                    }}
                  >
                    THEME ACQUIRED
                  </div>
                )}
              </div>

              {/* Card bottom strip */}
              <div
                className="px-3 py-1.5 font-mono text-[9px] tracking-widest text-center"
                style={{
                  backgroundColor: `${rarity.color}22`,
                  color: rarity.color,
                  borderTop: `1px solid ${rarity.color}44`,
                }}
              >
                RETAINLY // THEME SYSTEM
              </div>
            </div>

            {/* Particles */}
            {phase === "show" &&
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={
                    {
                      left: `${30 + Math.random() * 40}%`,
                      top: `${40 + Math.random() * 20}%`,
                      backgroundColor: rarity.color,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.8 + Math.random() * 0.8}s`,
                      "--drift-x": `${(Math.random() - 0.5) * 80}px`,
                    } as React.CSSProperties
                  }
                />
              ))}

            {/* Actions */}
            {phase === "show" && (
              <div
                className="slide-up w-full flex gap-3"
                style={{ opacity: 0, animationDelay: "0.1s" }}
              >
                {!isDuplicate && (
                  <button
                    onClick={onApply}
                    className="flex-1 py-2.5 rounded font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
                    style={{
                      backgroundColor: theme.color,
                      color: "#000",
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    APPLY THEME
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`${isDuplicate ? "flex-1" : ""} py-2.5 px-4 rounded font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-110`}
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                    border: `1px solid rgb(var(--theme-glow) / 0.2)`,
                    color: `rgb(var(--theme-glow) / 0.7)`,
                  }}
                >
                  CLOSE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Main page ──────────────────────────────────────────────────
const GachaPage = () => {
  const router = useRouter();
  const { gems, spendGems, addGems } = useGemsContext();
  const { unlockedThemes, unlockTheme, setColorTheme } = useTheme();
  const { t } = useLanguage();

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<(typeof ALL_THEMES)[number] | null>(
    null,
  );
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [pulseGem, setPulseGem] = useState(false);
  const [gemsFlash, setGemsFlash] = useState<"up" | "down" | null>(null);
  const prevGemsRef = useRef(gems);

  // Flash the gem count whenever it changes
  useEffect(() => {
    if (prevGemsRef.current === gems) return;
    const dir = gems > prevGemsRef.current ? "up" : "down";
    setGemsFlash(dir);
    prevGemsRef.current = gems;
    const t = setTimeout(() => setGemsFlash(null), 600);
    return () => clearTimeout(t);
  }, [gems]);

  const lockedThemes = ALL_THEMES.filter((t) => !unlockedThemes.includes(t.id));
  const allUnlocked = lockedThemes.length === 0;

  const handleSpin = async () => {
    if (gems < SPIN_COST || allUnlocked || spinning) return;

    const success = await spendGems(SPIN_COST);
    if (!success) return;

    setPulseGem(true);
    setTimeout(() => setPulseGem(false), 600);
    setSpinning(true);

    setTimeout(async () => {
      const pick =
        lockedThemes[Math.floor(Math.random() * lockedThemes.length)];
      const alreadyOwned = unlockedThemes.includes(pick.id);

      if (alreadyOwned) {
        const refund = Math.floor(SPIN_COST * 0.5);
        await addGems(refund);
        setIsDuplicate(true);
        setRefundAmount(refund);
      } else {
        await unlockTheme(pick.id);
        setIsDuplicate(false);
        setRefundAmount(0);
      }

      setResult(pick);
      setSpinning(false);
      setShowReveal(true);
    }, 900);
  };

  const handleCloseReveal = () => {
    setShowReveal(false);
    setResult(null);
  };

  const handleApply = () => {
    if (result) {
      setColorTheme(result.id);
      router.push("/");
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gemsUp {
          0%   { color: inherit; transform: scale(1); }
          30%  { color: #22c55e; transform: scale(1.15); }
          100% { color: inherit; transform: scale(1); }
        }
        @keyframes gemsDown {
          0%   { color: inherit; transform: scale(1); }
          30%  { color: #ef4444; transform: scale(0.9); }
          100% { color: inherit; transform: scale(1); }
        }
        .gems-up   { animation: gemsUp 0.6s ease forwards; }
        .gems-down { animation: gemsDown 0.6s ease forwards; }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--theme-primary); }
          50%       { box-shadow: 0 0 0 6px transparent; }
        }
        @keyframes spinDots {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1; transform: scale(1); }
        }

        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1  { animation-delay: 60ms; }
        .stagger-2  { animation-delay: 120ms; }
        .stagger-3  { animation-delay: 180ms; }

        .gem-drain  { animation: gemDrain 0.5s ease forwards; }

        .spin-btn {
          position: relative;
          overflow: hidden;
          transition: filter 0.15s, transform 0.1s;
        }
        .spin-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.45s ease;
        }
        .spin-btn:not(:disabled):hover::before { transform: translateX(100%); }
        .spin-btn:not(:disabled):hover  { filter: brightness(1.12); transform: translateY(-1px); }
        .spin-btn:not(:disabled):active { transform: scale(0.97); }
        .spin-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .spin-btn.ready    { animation: btnPulse 2s ease-in-out infinite; }

        .spin-dot { animation: spinDots 1.2s infinite; }
        .spin-dot:nth-child(2) { animation-delay: 0.2s; }
        .spin-dot:nth-child(3) { animation-delay: 0.4s; }

        .theme-card {
          transition: border-color 0.2s, background-color 0.2s, transform 0.2s, opacity 0.2s;
        }
        .theme-card.owned:hover { transform: translateY(-3px); }

        .banner-bg {
          background:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgb(var(--theme-glow) / 0.04) 39px,
              rgb(var(--theme-glow) / 0.04) 40px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgb(var(--theme-glow) / 0.04) 39px,
              rgb(var(--theme-glow) / 0.04) 40px
            );
        }
      `}</style>

      {/* Noise + Bloom */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.022,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 300,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.1) 0%, transparent 70%)",
        }}
      />

      {/* Reveal overlay */}
      {showReveal && result && (
        <BannerReveal
          theme={result}
          isDuplicate={isDuplicate}
          refundAmount={refundAmount}
          onClose={handleCloseReveal}
          onApply={handleApply}
        />
      )}

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-24">
          {/* ── Header ─────────────────────────────────── */}
          <div className="page-enter mb-10">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Gem
                className="w-3 h-3"
                style={{ color: "var(--theme-primary)" }}
              />
              <span>~/retainly/gacha</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>theme acquisition</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">
              {t("gacha.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("gacha.subtitle")}
            </p>
          </div>

          {/* ── Banner card ─────────────────────────────── */}
          <div className="page-enter stagger-1 mb-8">
            <SectionRule label="// 01  ACTIVE BANNER" />

            <div
              className="banner-bg rounded-2xl border overflow-hidden relative"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.2)`,
                minHeight: 220,
              }}
            >
              {/* Top info strip */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b font-mono text-[10px]"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400/40" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
                    <span className="w-2 h-2 rounded-full bg-green-400/40" />
                  </div>
                  <span style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
                    banner.sh
                  </span>
                </div>
                <div
                  className="flex items-center gap-4"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                >
                  <span>POOL: {ALL_THEMES.length} THEMES</span>
                  <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>
                    |
                  </span>
                  <span>LOCKED: {lockedThemes.length}</span>
                </div>
              </div>

              {/* Banner body */}
              <div className="flex items-stretch">
                {/* Left: gem balance */}
                <div
                  className="flex flex-col justify-between p-5 border-r"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.1)`,
                    minWidth: 160,
                  }}
                >
                  <div>
                    <p
                      className="font-mono text-[10px] tracking-widest mb-1"
                      style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                    >
                      {t("gacha.balance")}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Gem
                        className={`w-5 h-5 shrink-0 ${pulseGem ? "gem-drain" : ""}`}
                        style={{ color: "var(--theme-primary)" }}
                      />
                      <span
                        className={`text-3xl font-black tabular-nums leading-none ${
                          gemsFlash === "up"
                            ? "gems-up"
                            : gemsFlash === "down"
                              ? "gems-down"
                              : ""
                        }`}
                        style={{ color: "var(--theme-badge-text)" }}
                      >
                        {gems}
                      </span>
                    </div>
                    {/* Live indicator */}
                    <div
                      className="flex items-center gap-1.5 mt-2 font-mono text-[9px]"
                      style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      realtime
                    </div>
                  </div>

                  <div className="mt-4">
                    <p
                      className="font-mono text-[10px] tracking-widest mb-1"
                      style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                    >
                      {t("gacha.cost")}
                    </p>
                    <p
                      className="font-black text-lg"
                      style={{ color: "var(--theme-primary)" }}
                    >
                      💎 {SPIN_COST}
                    </p>
                  </div>

                  {/* Progress bar */}
                  {gems < SPIN_COST && (
                    <div className="mt-3">
                      <div
                        className="flex justify-between font-mono text-[9px] mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                      >
                        <span>progress</span>
                        <span>
                          {gems}/{SPIN_COST}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(gems / SPIN_COST) * 100}%`,
                            background: "var(--theme-primary)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Center: theme preview strips */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-4 overflow-hidden">
                  {/* Preview: show a few locked themes as "upcoming" */}
                  <div>
                    <p
                      className="font-mono text-[10px] tracking-widest mb-3"
                      style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                    >
                      AVAILABLE IN POOL
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_THEMES.map((theme) => {
                        const isUnlocked = unlockedThemes.includes(theme.id);
                        return (
                          <div
                            key={theme.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-[10px]"
                            style={{
                              borderColor: isUnlocked
                                ? `rgb(var(--theme-glow) / 0.08)`
                                : `${theme.color}44`,
                              backgroundColor: isUnlocked
                                ? `rgb(var(--theme-glow) / 0.02)`
                                : `${theme.color}0d`,
                              opacity: isUnlocked ? 0.35 : 1,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: isUnlocked
                                  ? `rgb(var(--theme-glow) / 0.3)`
                                  : theme.color,
                              }}
                            />
                            <span
                              style={{
                                color: isUnlocked
                                  ? `rgb(var(--theme-glow) / 0.4)`
                                  : "var(--theme-badge-text)",
                              }}
                            >
                              {isUnlocked ? "✓" : theme.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spin button */}
                  <div>
                    {allUnlocked ? (
                      <div
                        className="py-3 text-center rounded border font-mono text-sm"
                        style={{
                          borderColor: `rgb(var(--theme-glow) / 0.15)`,
                          color: `rgb(var(--theme-glow) / 0.4)`,
                        }}
                      >
                        {t("gacha.all_unlocked")}
                      </div>
                    ) : (
                      <button
                        onClick={handleSpin}
                        disabled={spinning || gems < SPIN_COST}
                        className={`spin-btn w-full py-3 rounded font-black text-sm flex items-center justify-center gap-2 ${!spinning && gems >= SPIN_COST ? "ready" : ""}`}
                        style={{
                          background: "var(--theme-primary)",
                          color: "#fff",
                          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      >
                        {spinning ? (
                          <span className="flex items-center gap-2">
                            <span className="flex gap-1">
                              <span className="spin-dot w-1.5 h-1.5 rounded-full bg-white inline-block" />
                              <span className="spin-dot w-1.5 h-1.5 rounded-full bg-white inline-block" />
                              <span className="spin-dot w-1.5 h-1.5 rounded-full bg-white inline-block" />
                            </span>
                            <span className="font-mono text-xs tracking-widest">
                              ACQUIRING...
                            </span>
                          </span>
                        ) : (
                          <>
                            {t("gacha.spin")}
                            <span
                              className="ml-1 px-2 py-0.5 rounded font-mono text-xs"
                              style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                            >
                              💎 {SPIN_COST}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {gems < SPIN_COST && !allUnlocked && !spinning && (
                      <p
                        className="mt-2 font-mono text-[10px] text-center"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                      >
                        {SPIN_COST - gems} more gems needed — earn by studying
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Collection ──────────────────────────────── */}
          <div className="page-enter stagger-2">
            <SectionRule
              label={`// 02  COLLECTION — ${unlockedThemes.length}/${ALL_THEMES.length} OWNED`}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_THEMES.map((theme, i) => {
                const isUnlocked = unlockedThemes.includes(theme.id);
                const rarity = getRarity(i);
                return (
                  <div
                    key={theme.id}
                    className={`theme-card rounded border p-4 text-center space-y-3 ${isUnlocked ? "owned" : ""}`}
                    style={{
                      borderColor: isUnlocked
                        ? `${theme.color}44`
                        : `rgb(var(--theme-glow) / 0.1)`,
                      backgroundColor: isUnlocked
                        ? `${theme.color}0d`
                        : `rgb(var(--theme-glow) / 0.02)`,
                      opacity: isUnlocked ? 1 : 0.4,
                      borderRadius: "4px",
                    }}
                  >
                    {/* Rarity bar on top */}
                    <div
                      className="h-0.5 w-full rounded-full -mt-4 -mx-4 mb-0"
                      style={{
                        backgroundColor: isUnlocked
                          ? rarity.color
                          : "transparent",
                        width: "calc(100% + 2rem)",
                        marginLeft: "-1rem",
                        marginTop: "-1rem",
                        marginBottom: "0.75rem",
                      }}
                    />

                    <div
                      className="w-10 h-10 rounded-sm mx-auto flex items-center justify-center relative"
                      style={{
                        backgroundColor: isUnlocked
                          ? theme.color
                          : "transparent",
                        border: isUnlocked
                          ? "none"
                          : `1px dashed rgb(var(--theme-glow) / 0.2)`,
                        boxShadow: isUnlocked
                          ? `0 4px 16px ${theme.color}55`
                          : "none",
                      }}
                    >
                      {!isUnlocked && (
                        <Lock
                          className="w-3.5 h-3.5"
                          style={{ color: `rgb(var(--theme-glow) / 0.25)` }}
                        />
                      )}
                    </div>

                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{
                          color: isUnlocked
                            ? "var(--foreground)"
                            : `rgb(var(--theme-glow) / 0.3)`,
                        }}
                      >
                        {isUnlocked ? theme.label : "???"}
                      </p>
                      <p
                        className="font-mono text-[9px] mt-0.5"
                        style={{
                          color: rarity.color,
                          opacity: isUnlocked ? 1 : 0.3,
                        }}
                      >
                        {rarity.label.substring(0, rarity.stars)}
                      </p>
                    </div>

                    <span
                      className="inline-block font-mono text-[10px] px-2 py-0.5 rounded"
                      style={
                        isUnlocked
                          ? {
                              backgroundColor: `${theme.color}22`,
                              color: theme.color,
                              border: `1px solid ${theme.color}33`,
                            }
                          : { color: `rgb(var(--theme-glow) / 0.25)` }
                      }
                    >
                      {isUnlocked ? t("gacha.owned") : t("gacha.locked")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 flex items-center gap-4">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
            />
            <span
              className="font-mono text-[10px] tracking-[0.25em]"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
            >
              RETAINLY
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GachaPage;
