"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface RewardPopupProps {
  streakDay: number;
  onClaim: () => void;
}

const DAILY_REWARD = 30;
const DAYS = [1, 2, 3, 4, 5, 6, 7];

const RewardPopup = ({ streakDay, onClaim }: RewardPopupProps) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (claimed) {
      const t = setTimeout(() => onClaim(), 1400);
      return () => clearTimeout(t);
    }
  }, [claimed, onClaim]);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    await onClaim();
    setClaimed(true);
    setClaiming(false);
  };

  // streakDay is 0-indexed (0 = Day 1, 6 = Day 7)
  // days before today are claimed, today is current, after are future
  const getDayState = (dayIndex: number): "claimed" | "today" | "future" => {
    if (dayIndex < streakDay) return "claimed";
    if (dayIndex === streakDay) return "today";
    return "future";
  };

  const topRow = DAYS.slice(0, 4);   // Day 1-4
  const bottomRow = DAYS.slice(4);   // Day 5-7

  const DayCell = ({ dayIndex }: { dayIndex: number }) => {
    const state = getDayState(dayIndex);
    const isTodayClaimed = state === "today" && claimed;

    return (
      <div
        className="flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all duration-300"
        style={{
          backgroundColor:
            state === "claimed" || isTodayClaimed
              ? `rgb(34 197 94 / 0.08)`
              : state === "today"
              ? `rgb(var(--theme-glow) / 0.12)`
              : `rgb(var(--theme-glow) / 0.03)`,
          border: `1px solid ${
            state === "claimed" || isTodayClaimed
              ? "rgb(34 197 94 / 0.25)"
              : state === "today"
              ? `rgb(var(--theme-glow) / 0.4)`
              : `rgb(var(--theme-glow) / 0.08)`
          }`,
          boxShadow:
            state === "today" && !claimed
              ? `0 0 16px rgb(var(--theme-glow) / 0.2)`
              : "none",
          opacity: state === "future" ? 0.4 : 1,
        }}
      >
        {/* Icon */}
        <div className="w-8 h-8 flex items-center justify-center">
          {state === "claimed" || isTodayClaimed ? (
            <CheckCircle
              className="w-5 h-5 transition-all duration-300"
              style={{ color: "#22c55e" }}
            />
          ) : state === "today" ? (
            <span
              className="text-xl"
              style={{
                animation: claimed ? "none" : "gemBounce 1.4s ease-in-out infinite",
              }}
            >
              💎
            </span>
          ) : (
            <span className="text-xl opacity-40">💎</span>
          )}
        </div>

        {/* Day label */}
        <span
          className="text-[10px] font-semibold"
          style={{
            color:
              state === "claimed" || isTodayClaimed
                ? "#22c55e"
                : state === "today"
                ? "var(--theme-badge-text)"
                : "var(--muted-foreground)",
          }}
        >
          {state === "today" ? "Today" : `Day ${dayIndex + 1}`}
        </span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative rounded-3xl p-6 flex flex-col gap-5 mx-6 max-w-sm w-full"
        style={{
          backgroundColor: "var(--background)",
          border: `1px solid rgb(var(--theme-glow) / 0.2)`,
          boxShadow: `0 0 60px rgb(var(--theme-glow) / 0.12)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-lg font-black text-foreground">Daily Reward</p>
          <p className="text-xs text-muted-foreground">
            Login every day to earn 💎 {DAILY_REWARD} gems
          </p>
        </div>

        {/* 4 + 3 grid */}
        <div className="space-y-2">
          {/* Top row — 4 days */}
          <div className="grid grid-cols-4 gap-2">
            {topRow.map((_, i) => (
              <DayCell key={i} dayIndex={i} />
            ))}
          </div>
          {/* Bottom row — 3 days centered */}
          <div className="grid grid-cols-3 gap-2 mx-8">
            {bottomRow.map((_, i) => (
              <DayCell key={i + 4} dayIndex={i + 4} />
            ))}
          </div>
        </div>

        {/* Reward amount */}
        <div className="text-center">
          <p
            className="text-4xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--theme-gradient)" }}
          >
            +{DAILY_REWARD}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">gems for today</p>
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={claiming || claimed}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-60"
          style={{
            background: claimed
              ? "rgb(34 197 94 / 0.15)"
              : "var(--theme-gradient)",
            color: claimed ? "#22c55e" : "#fff",
            textShadow: claimed ? "none" : "0 1px 3px rgba(0,0,0,0.3)",
            border: claimed ? "1px solid rgb(34 197 94 / 0.3)" : "none",
          }}
        >
          {claimed ? "✓ Claimed!" : claiming ? "Claiming..." : "Claim Gems"}
        </button>
      </div>

      <style>{`
        @keyframes gemBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default RewardPopup;