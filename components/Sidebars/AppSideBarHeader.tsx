import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";

const AppSideBarHeader = () => {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem className="p-5">
          <div className="flex flex-col justify-center items-start gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{
                  background: "var(--theme-gradient)",
                  color: "var(--theme-button-text)",
                }}
              >
                R
              </div>
              <h1
                className="font-black text-xl bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--theme-gradient)" }}
              >
                Retainly
              </h1>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-widest uppercase"
              style={{
                color: "var(--theme-badge-text)",
                borderColor: `rgb(var(--theme-glow) / 0.3)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
              }}
            >
              Demo
            </span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};

export default AppSideBarHeader;