"use client";

import { logActivity } from "@/lib/db";

interface StreakPopupProps {
  streak: number;
  onDismiss: () => void;
}

const StreakPopup = async ({ streak, onDismiss }: StreakPopupProps) => {
  await logActivity();
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center cursor-pointer"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-4 select-none">

        {/* Fire animation */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute w-40 h-40 rounded-full blur-2xl animate-pulse"
            style={{ backgroundColor: "rgb(251 146 60 / 0.3)" }}
          />
          {/* Fire emoji */}
          <div
            className="text-[96px] leading-none relative z-10"
            style={{
              animation: "fireFloat 1.2s ease-in-out infinite alternate",
              filter: "drop-shadow(0 0 24px rgb(251 146 60 / 0.8))",
            }}
          >
            🔥
          </div>
        </div>

        {/* Streak number */}
        <div className="text-center space-y-1">
          <p
            className="text-8xl font-black leading-none"
            style={{
              background: "linear-gradient(135deg, #fb923c, #f97316, #ea580c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 12px rgb(251 146 60 / 0.5))",
            }}
          >
            {streak}
          </p>
          <p className="text-xl font-bold text-white/90">
            {streak === 1 ? "Day Streak!" : "Days Streak!"}
          </p>
          {streak >= 7 && (
            <p className="text-sm font-semibold text-orange-400">
              {streak >= 30 ? "🏆 Legendary!" : streak >= 14 ? "⚡ On Fire!" : "🌟 Keep it up!"}
            </p>
          )}
        </div>

        {/* Tap to continue */}
        <p
          className="text-xs text-white/30 mt-6 animate-pulse"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        >
          tap anywhere to continue
        </p>
      </div>

      {/* Fire float keyframe */}
      <style>{`
        @keyframes fireFloat {
          from { transform: scale(1) rotate(-2deg); }
          to   { transform: scale(1.08) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default StreakPopup;