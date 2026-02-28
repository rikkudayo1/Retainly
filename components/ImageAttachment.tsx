"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, AlertCircle } from "lucide-react";

interface ImageAttachmentProps {
  onImageSelect: (base64: string, mimeType: string, name: string) => void;
  onImageClear: () => void;
  selectedImage: { base64: string; mimeType: string; name: string } | null;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageAttachment = ({
  onImageSelect,
  onImageClear,
  selectedImage,
  disabled = false,
}: ImageAttachmentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Strip the data:mime/type;base64, prefix — API only wants the raw base64
      const base64 = dataUrl.split(",")[1];
      onImageSelect(base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // ── Preview state — image selected ──────────────────────────
  if (selectedImage) {
    return (
      <div className="space-y-2">
        <div
          className="relative rounded-xl border overflow-hidden flex items-center gap-3 px-3 py-2.5"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.25)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
          }}
        >
          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}>
            <img
              src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`}
              alt={selectedImage.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* File name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--theme-badge-text)" }}>
              {selectedImage.name}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              Image attached
            </p>
          </div>

          {/* Clear button */}
          <button
            onClick={() => { onImageClear(); setError(null); }}
            className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
              color: "var(--muted-foreground)",
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Drop zone — no image selected ───────────────────────────
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-all cursor-pointer"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.25)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`;
            (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.4)`;
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.02)`;
          (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.25)`;
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
        >
          <ImageIcon className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--theme-badge-text)" }}>
            Attach an image
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            JPG, PNG, WEBP · max 5MB · drag & drop or click
          </p>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
          style={{
            borderColor: "rgb(239 68 68 / 0.3)",
            backgroundColor: "rgb(239 68 68 / 0.07)",
            color: "#ef4444",
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageAttachment;
export type { ImageAttachmentProps };
export type ImageState = { base64: string; mimeType: string; name: string } | null;