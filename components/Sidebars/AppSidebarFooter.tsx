"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarFooter, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";
import Link from "next/link";
import { Gem, LogOut, Terminal } from "lucide-react";
import { useGemsContext } from "@/context/GemsContext";
import { useStreak } from "@/hooks/useStreak";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const AppSidebarFooter = () => {
  const { gems } = useGemsContext();
  const { streak, checked } = useStreak();
  const router = useRouter();

  const [gemsFlash, setGemsFlash] = useState<"up" | "down" | null>(null);
  const prevGemsRef = useRef(gems);

  useEffect(() => {
    if (prevGemsRef.current === gems) return;
    const dir = gems > prevGemsRef.current ? "up" : "down";
    setGemsFlash(dir);
    prevGemsRef.current = gems;
    const t = setTimeout(() => setGemsFlash(null), 600);
    return () => clearTimeout(t);
  }, [gems]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <SidebarFooter>
      <style>{`
        @keyframes gemsUp {
          0%   { color: inherit; transform: scale(1); }
          30%  { color: #22c55e; transform: scale(1.18); }
          100% { color: inherit; transform: scale(1); }
        }
        @keyframes gemsDown {
          0%   { color: inherit; transform: scale(1); }
          30%  { color: #ef4444; transform: scale(0.85); }
          100% { color: inherit; transform: scale(1); }
        }
        .gems-flash-up   { animation: gemsUp   0.6s ease forwards; }
        .gems-flash-down { animation: gemsDown 0.6s ease forwards; }
      `}</style>

      <SidebarMenu>
        <SidebarMenuItem className="px-3 py-3 space-y-1.5">

          {/* Divider rule */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
            <span className="font-mono text-[9px] tracking-[0.2em]"
              style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>
              //
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
          </div>

          {/* Gems → Gacha */}
          <button
            onClick={() => router.push("/gacha")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-150"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
              borderColor: `rgb(var(--theme-glow) / 0.15)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.1)`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.25)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.05)`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
            }}
          >
            <div className="flex items-center gap-2 font-mono text-xs"
              style={{ color: "var(--theme-badge-text)" }}>
              <Gem className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
              <span
                className={
                  gemsFlash === "up" ? "gems-flash-up"
                  : gemsFlash === "down" ? "gems-flash-down"
                  : ""
                }
              >
                {gems}
              </span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>gems</span>
            </div>
            <span
              className="font-mono text-[10px]"
              style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
            >
              gacha →
            </span>
          </button>

          {/* Streak */}
          {!checked ? (
            <div
              className="h-8 rounded-xl"
              style={{
                background: `linear-gradient(90deg, rgb(var(--theme-glow)/0.04) 0%, rgb(var(--theme-glow)/0.07) 50%, rgb(var(--theme-glow)/0.04) 100%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.6s ease-in-out infinite",
              }}
            />
          ) : streak > 0 ? (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl border"
              style={{
                borderColor: "rgb(249 115 22 / 0.2)",
                backgroundColor: "rgb(249 115 22 / 0.04)",
              }}
            >
              <div className="flex items-center gap-2 font-mono text-xs">
                <span>🔥</span>
                <span className="font-bold" style={{ color: "rgb(251 146 60)" }}>
                  {streak}
                </span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  day{streak !== 1 ? "s" : ""}
                </span>
              </div>
              <span
                className="font-mono text-[10px]"
                style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
              >
                streak
              </span>
            </div>
          ) : null}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs transition-all duration-150"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgb(239 68 68 / 0.07)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = `rgb(var(--theme-glow) / 0.4)`;
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            sign_out
          </button>

          {/* Footer credit */}
          <div
            className="rounded-xl px-3 py-2.5 border mt-2"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.1)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Terminal className="w-3 h-3" style={{ color: `rgb(var(--theme-glow) / 0.3)` }} />
              <span
                className="font-mono text-[10px]"
                style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
              >
                // made with ♥ at
              </span>
            </div>
            <Link
              href="https://cru.ac.th/"
              target="_blank"
              className="font-mono text-[11px] font-bold transition-all hover:underline"
              style={{ color: "var(--theme-primary)" }}
            >
              ChonChai
            </Link>
          </div>

        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default AppSidebarFooter;