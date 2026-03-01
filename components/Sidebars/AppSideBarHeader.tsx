import { Brain } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";

const AppSideBarHeader = () => {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem className="p-4 pb-3">
          {/* Path label */}
          <p
            className="font-mono text-[10px] mb-2.5 tracking-wide"
            style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
          >
            ~/retainly
          </p>

          {/* Logo row */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `rgb(var(--theme-glow) / 0.12)`,
                border: `1px solid rgb(var(--theme-glow) / 0.2)`,
              }}
            >
              <Brain className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
            </div>
            <h1
              className="font-black text-lg tracking-tight"
              style={{ color: "var(--theme-primary)" }}
            >
              Retainly
            </h1>
          </div>

          {/* Demo badge */}
          <div className="mt-3">
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded border tracking-[0.15em] uppercase"
              style={{
                color: `rgb(var(--theme-glow) / 0.5)`,
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}
            >
              // demo
            </span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};

export default AppSideBarHeader;