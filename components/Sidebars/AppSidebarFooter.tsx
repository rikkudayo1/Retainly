"use client";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";
import Link from "next/link";
import { Heart, Gem } from "lucide-react";
import { useGems } from "@/hooks/useGems";
import { useRouter } from "next/navigation";

const AppSidebarFooter = () => {
  const { gems } = useGems();
  const router = useRouter();

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
              <Gem className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
              {gems} gems
            </div>
            <span className="text-[10px] text-muted-foreground">Gacha →</span>
          </button>

          {/* Made with love card */}
          <div
            className="rounded-xl p-3 border text-xs text-muted-foreground"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.15)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span className="font-medium text-foreground/70">Made with love</span>
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