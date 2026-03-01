"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle, Terminal } from "lucide-react";

interface RewardPopupProps {
  streakDay: number;
  onClaim: () => void;
}

const DAILY_REWARD = 30;
const DAYS = [1, 2, 3, 4, 5, 6, 7];

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  type: "gem" | "plus" | "dot" | "ring" | "star";
  color: string;
}

const COLORS = [
  "#a78bfa", "#38bdf8", "#facc15", "#fb7185", "#22c55e", "#f97316",
];

const RewardPopup = ({ streakDay, onClaim }: RewardPopupProps) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [btnRect, setBtnRect] = useState<DOMRect | null>(null);
  const [buttonShake, setButtonShake] = useState(false);
  const claimBtnRef = useRef<HTMLButtonElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (claimed) {
      const t = setTimeout(() => onClaim(), 3200);
      return () => clearTimeout(t);
    }
  }, [claimed, onClaim]);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const spawnParticles = (rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const newParticles: Particle[] = [];
    const types: Particle["type"][] = ["gem", "gem", "plus", "dot", "dot", "dot", "ring", "star"];

    // Radial burst
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 11;
      newParticles.push({
        id: i,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 6 + Math.random() * 16,
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        type: types[Math.floor(Math.random() * types.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    // Upward floaters
    for (let i = 0; i < 14; i++) {
      newParticles.push({
        id: 60 + i,
        x: cx + (Math.random() - 0.5) * rect.width * 1.2,
        y: cy + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(1.5 + Math.random() * 5),
        size: 12 + Math.random() * 12,
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        type: "gem",
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    particlesRef.current = newParticles;
    setParticles([...newParticles]);
  };

  const animateParticles = () => {
    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.32,
        vx: p.vx * 0.97,
        opacity: p.opacity - 0.016,
        rotation: p.rotation + p.rotationSpeed,
        size: p.size * 0.988,
      }))
      .filter((p) => p.opacity > 0);

    setParticles([...particlesRef.current]);

    if (particlesRef.current.length > 0) {
      animFrameRef.current = requestAnimationFrame(animateParticles);
    }
  };

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);

    const rect = claimBtnRef.current?.getBoundingClientRect() ?? null;
    setBtnRect(rect);

    await onClaim();

    // Shake button
    setButtonShake(true);
    setTimeout(() => setButtonShake(false), 400);

    // White flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 320);

    // Particles
    if (rect) {
      spawnParticles(rect);
      animFrameRef.current = requestAnimationFrame(animateParticles);
    }

    // Floating +30
    setShowNumbers(true);
    setTimeout(() => setShowNumbers(false), 2000);

    setClaimed(true);
    setClaiming(false);
  };

  const getDayState = (dayIndex: number): "claimed" | "today" | "future" => {
    if (dayIndex < streakDay) return "claimed";
    if (dayIndex === streakDay) return "today";
    return "future";
  };

  const DayCell = ({ dayIndex }: { dayIndex: number }) => {
    const state = getDayState(dayIndex);
    const isTodayClaimed = state === "today" && claimed;
    return (
      <div
        className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-500"
        style={{
          backgroundColor:
            state === "claimed" || isTodayClaimed ? "rgb(34 197 94 / 0.07)"
              : state === "today" ? `rgb(var(--theme-glow) / 0.1)`
              : `rgb(var(--theme-glow) / 0.02)`,
          border: `1px solid ${
            state === "claimed" || isTodayClaimed ? "rgb(34 197 94 / 0.25)"
              : state === "today" ? `rgb(var(--theme-glow) / 0.35)`
              : `rgb(var(--theme-glow) / 0.08)`
          }`,
          opacity: state === "future" ? 0.35 : 1,
          transform: isTodayClaimed ? "scale(1.1)" : "scale(1)",
        }}
      >
        <div className="w-7 h-7 flex items-center justify-center">
          {state === "claimed" || isTodayClaimed ? (
            <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
          ) : state === "today" ? (
            <span className="text-lg" style={{ display: "inline-block", animation: claimed ? "none" : "gemBounce 1.4s ease-in-out infinite" }}>
              💎
            </span>
          ) : (
            <span className="text-base opacity-30">💎</span>
          )}
        </div>
        <span className="font-mono text-[9px] font-bold" style={{
          color: state === "claimed" || isTodayClaimed ? "#22c55e"
            : state === "today" ? "var(--theme-badge-text)"
            : `rgb(var(--theme-glow) / 0.3)`,
        }}>
          {state === "today" ? "today" : `d_${String(dayIndex + 1).padStart(2, "0")}`}
        </span>
      </div>
    );
  };

  const renderParticle = (p: Particle) => {
    const base: React.CSSProperties = {
      position: "fixed",
      left: p.x,
      top: p.y,
      opacity: p.opacity,
      transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
      pointerEvents: "none",
      zIndex: 10000,
      willChange: "transform, opacity",
    };

    if (p.type === "gem") return <span key={p.id} style={{ ...base, fontSize: p.size }}>💎</span>;
    if (p.type === "star") return <span key={p.id} style={{ ...base, fontSize: p.size }}>✦</span>;
    if (p.type === "plus") return (
      <span key={p.id} style={{ ...base, fontSize: p.size, color: p.color, fontWeight: 900, fontFamily: "monospace" }}>+</span>
    );
    if (p.type === "ring") return (
      <div key={p.id} style={{ ...base, width: p.size, height: p.size, borderRadius: "50%", border: `2.5px solid ${p.color}` }} />
    );
    return <div key={p.id} style={{ ...base, width: p.size, height: p.size, borderRadius: "50%", backgroundColor: p.color }} />;
  };

  return (
    <>
      {/* Flash */}
      {showFlash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none",
          background: "rgba(255,255,255,0.18)",
          animation: "flashOut 0.32s ease forwards",
        }} />
      )}

      {/* Particles */}
      {particles.map(renderParticle)}

      {/* Floating +30 numbers */}
      {showNumbers && btnRect && [0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "fixed",
          left: btnRect.left + btnRect.width * (0.2 + i * 0.3),
          top: btnRect.top - 10,
          zIndex: 10001,
          pointerEvents: "none",
          animation: `floatUp 1.8s ${i * 100}ms cubic-bezier(0.22,1,0.36,1) forwards`,
          fontWeight: 900,
          fontSize: i === 1 ? 30 : 22,
          color: i === 1 ? "var(--theme-primary)" : "#22c55e",
          fontFamily: "monospace",
          textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}>
          +{DAILY_REWARD} 💎
        </div>
      ))}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      >
        <div
          className="relative rounded-2xl overflow-hidden w-full max-w-sm"
          style={{
            backgroundColor: "var(--background)",
            border: `1px solid ${claimed ? "rgb(34 197 94 / 0.35)" : "rgb(var(--theme-glow) / 0.2)"}`,
            transform: claimed ? "scale(1.025)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.4s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Titlebar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
            <span className="w-2 h-2 rounded-full bg-red-400/50" />
            <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
            <span className="w-2 h-2 rounded-full bg-green-400/50" />
            <span className="ml-3 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              daily_reward.sh
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/rewards</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{claimed ? "Gems Claimed! 🎉" : "Daily Reward"}</h2>
              <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                {claimed ? "// see you tomorrow!" : `// login streak · earn 💎 ${DAILY_REWARD} gems/day`}
              </p>
            </div>

            {/* Day grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {DAYS.slice(0, 4).map((_, i) => <DayCell key={i} dayIndex={i} />)}
              </div>
              <div className="grid grid-cols-3 gap-2 mx-8">
                {DAYS.slice(4).map((_, i) => <DayCell key={i + 4} dayIndex={i + 4} />)}
              </div>
            </div>

            {/* Reward card */}
            <div className="rounded-xl border px-4 py-3 flex items-center justify-between transition-all duration-500"
              style={{
                borderColor: claimed ? "rgb(34 197 94 / 0.3)" : `rgb(var(--theme-glow) / 0.12)`,
                backgroundColor: claimed ? "rgb(34 197 94 / 0.05)" : `rgb(var(--theme-glow) / 0.03)`,
              }}>
              <div>
                <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  {claimed ? "// reward claimed!" : "// today's reward"}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: claimed ? "#22c55e" : "var(--theme-badge-text)" }}>
                  Day {streakDay + 1} reward
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black transition-colors duration-500"
                  style={{ color: claimed ? "#22c55e" : "var(--theme-primary)" }}>
                  +{DAILY_REWARD}
                </p>
                <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>gems</p>
              </div>
            </div>

            {/* Claim button */}
            <button
              ref={claimBtnRef}
              onClick={handleClaim}
              disabled={claiming || claimed}
              className="w-full py-3 rounded-xl font-bold text-sm font-mono transition-all hover:brightness-110 disabled:opacity-70"
              style={{
                background: claimed ? "rgb(34 197 94 / 0.1)" : "var(--theme-primary)",
                color: claimed ? "#22c55e" : "#fff",
                border: claimed ? "1px solid rgb(34 197 94 / 0.3)" : "none",
                animation: buttonShake ? "shake 0.4s ease" : "none",
              }}
            >
              {claimed ? "✓ claimed" : claiming ? "$ claiming..." : "$ claim_gems"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gemBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes flashOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          12%  { opacity: 1; transform: translateY(-12px) scale(1.15); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-100px) scale(0.85); }
        }
        @keyframes shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-5px); }
          40%  { transform: translateX(5px); }
          60%  { transform: translateX(-3px); }
          80%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default RewardPopup;