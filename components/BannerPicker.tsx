"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { BANNERS } from "@/lib/banners";
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", color: "#fff", backdropFilter: "blur(8px)" }}
        >
          <Pencil className="w-3 h-3" />
          Edit Banner
        </button>
      </DrawerTrigger>

      <DrawerContent
        style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.2)` }}
      >
        <DrawerHeader>
          <DrawerTitle className="text-foreground font-black">Choose Banner</DrawerTitle>
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
                  className="relative rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                  style={{ height: 80 }}
                >
                  {/* Gradient preview */}
                  <div
                    className="w-full h-full"
                    style={{ background: banner.gradient }}
                  />

                  {/* Label */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                  >
                    {banner.label}
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--theme-primary)" }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Selected ring */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                      style={{ borderColor: "var(--theme-primary)" }}
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