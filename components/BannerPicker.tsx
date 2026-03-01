"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { BANNERS, Banner } from "@/lib/banners";
import { updateProfileSettings } from "@/lib/db";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface BannerPickerProps {
  currentBannerId: string;
  onChanged: (id: string) => void;
}

/** Converts a Banner object into React inline style for rendering */
export const bannerStyle = (b: Banner): React.CSSProperties => ({
  backgroundImage: b.backgroundImage,
  backgroundSize: b.backgroundSize,
  backgroundRepeat: b.backgroundRepeat,
  backgroundPosition: b.backgroundPosition,
});

const BannerPicker = ({ currentBannerId, onChanged }: BannerPickerProps) => {
  const [selected, setSelected] = useState(currentBannerId);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSelect = async (id: string) => {
    setSaving(true);
    setSelected(id);
    await updateProfileSettings({ banner_id: id });
    onChanged(id);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[10px] tracking-wide transition-all"
          style={{
            borderColor: "rgba(255,255,255,0.25)",
            backgroundColor: "rgba(0,0,0,0.35)",
            color: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.5)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.45)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.35)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
          }}
        >
          <Pencil className="w-3 h-3" />
          edit_banner
        </button>
      </DrawerTrigger>

      <DrawerContent
        style={{
          backgroundColor: "var(--background)",
          borderColor: `rgb(var(--theme-glow) / 0.2)`,
        }}
      >
        {/* Terminal titlebar inside drawer */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 border-b"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.1)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-red-400/50" />
          <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
          <span className="w-2 h-2 rounded-full bg-green-400/50" />
          <span
            className="ml-3 font-mono text-[10px]"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
          >
            select_banner.sh
          </span>
        </div>

        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-black text-foreground sr-only">
            Choose Banner
          </DrawerTitle>
          {/* Section rule */}
          <div className="flex items-center gap-3 pt-1">
            <span
              className="font-mono text-[10px] tracking-[0.2em] shrink-0"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              // {BANNERS.length} BANNERS
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
            />
          </div>
        </DrawerHeader>

        <div className="px-4 pb-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {BANNERS.map((banner) => {
              const isSelected = selected === banner.id;
              return (
                <button
                  key={banner.id}
                  onClick={() => handleSelect(banner.id)}
                  disabled={saving}
                  className="relative rounded-xl overflow-hidden border transition-all duration-150 group hover:scale-[1.03] active:scale-95"
                  style={{
                    height: 80,
                    borderColor: isSelected
                      ? "var(--theme-primary)"
                      : `rgb(var(--theme-glow) / 0.15)`,
                    boxShadow: isSelected
                      ? `0 0 0 1px var(--theme-primary), 0 0 10px rgb(var(--theme-glow) / 0.15)`
                      : "none",
                  }}
                >
                  {/* Banner preview */}
                  <div
                    className="w-full h-full"
                    style={bannerStyle(banner)}
                  />

                  {/* Label strip */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 font-mono text-[9px] text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
                  >
                    {banner.label.toLowerCase()}
                  </div>

                  {/* Selected overlay */}
                  {isSelected && (
                    <>
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div
                        className="absolute inset-0 rounded-xl border-2 pointer-events-none"
                        style={{ borderColor: "var(--theme-primary)" }}
                      />
                    </>
                  )}

                  {/* Hover tint */}
                  {!isSelected && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                      style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BannerPicker;