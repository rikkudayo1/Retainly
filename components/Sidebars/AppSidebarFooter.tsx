"use client";

import { SidebarFooter, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";
import Link from "next/link";
import { Heart, Gem, LogOut } from "lucide-react";
import { useGems } from "@/hooks/useGems";
import { useStreak } from "@/hooks/useStreak";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const AppSidebarFooter = () => {
  const { gems } = useGems();
  const { streak } = useStreak();
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem className="p-3 mb-2 space-y-2">
          {/* Gem counter — clickable to go to gacha */}
          <button
            onClick={() => router.push("/gacha")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all hover:brightness-110"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--theme-badge-text)",
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Gem
                className="w-3.5 h-3.5"
                style={{ color: "var(--theme-primary)" }}
              />
              {gems} gems
            </div>
            <span className="text-[10px] text-muted-foreground">Gacha →</span>
          </button>

          {streak > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-muted-foreground"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}
            >
              <span className="flex items-center gap-1.5">
                🔥{" "}
                <span className="font-semibold text-foreground/70">
                  {streak} day{streak !== 1 ? "s" : ""}
                </span>
              </span>
              <span className="text-muted-foreground/50">streak</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground transition-all hover:text-red-400"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgb(239 68 68 / 0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          {/* Made with love card */}
          <div
            className="rounded-xl p-3 border text-xs text-muted-foreground mt-7"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.15)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Heart
                className="w-3 h-3"
                style={{ color: "var(--theme-primary)" }}
              />
              <span className="font-medium text-foreground/70">
                Made with love
              </span>
            </div>
            <Link
              href="https://cru.ac.th/"
              className="hover:underline transition-all"
              style={{ color: "var(--theme-badge-text)" }}
              target="_blank"
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
