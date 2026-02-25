"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { uploadAvatar } from "@/lib/db";

interface AvatarUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  size?: number;
}

const AvatarUpload = ({ currentUrl, onUploaded, size = 96 }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const url = await uploadAvatar(file);
    setUploading(false);

    if (url) {
      setPreview(url);
      onUploaded(url);
    }
  };

  return (
    <div
      className="relative cursor-pointer group"
      style={{ width: size, height: size }}
      onClick={() => inputRef.current?.click()}
    >
      {/* Avatar circle */}
      <div
        className="w-full h-full rounded-full overflow-hidden border-2 transition-all"
        style={{ borderColor: "var(--theme-primary)" }}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-black"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-primary)" }}
          >
            ?
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

export default AvatarUpload;