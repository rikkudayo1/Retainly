'use client'

import { SidebarContent, SidebarGroup, SidebarGroupLabel } from "../ui/sidebar";
import Main from "./Collapsibles/Main";
import Generate from "./Collapsibles/Generate";
import Gacha from "./Collapsibles/Gacha";
import Quiz from "./Collapsibles/Quiz";
import Link from "next/link";
import Settings from "./Collapsibles/ProfileSetting";
import { HomeIcon } from "lucide-react";

const AppSideBarContent = () => {
  return (
    <SidebarContent className="p-3">
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">
          Explore
        </SidebarGroupLabel>
        <Link
          className="flex items-center gap-2.5 p-2 w-full rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all group"
          href="/"
          style={{}}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
            (e.currentTarget as HTMLAnchorElement).style.color = `var(--theme-badge-text)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "";
          }}
        >
          <HomeIcon size={16} />
          <span>Home</span>
        </Link>
        <div className="mt-2 space-y-1">
          <Main />
          <Quiz />
          <Generate />
          <Gacha />
          <Settings />
        </div>
      </SidebarGroup>
    </SidebarContent>
  );
};

export default AppSideBarContent;