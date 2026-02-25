"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, UploadCloud } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, saveFile, deleteFile, DBFile } from "@/lib/db";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExt = (name: string) => name.split(".").pop()?.toUpperCase() || "FILE";

const UploadPage = () => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<DBFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load files from Supabase on mount
  useEffect(() => {
    getFiles().then((data) => {
      setFiles(data);
      setLoadingFiles(false);
    });
  }, []);

  const processFile = async (selected: File) => {
    setUploading(true);
    try {
      let text = "";
      if (selected.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", selected);
        const res = await fetch("/api/extract", { method: "POST", body: formData });
        const data = await res.json();
        text = data.text;
      } else {
        text = await selected.text();
      }

      const saved = await saveFile({
        name: selected.name,
        size: selected.size,
        uploaded_at: new Date().toISOString(),
        text,
      });

      if (saved) setFiles((prev) => [saved, ...prev]);
    } catch (err) {
      console.error("Failed to read file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDelete = async (id: string) => {
    await deleteFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-1">{t("upload.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("upload.subtitle")}</p>
        <div className="mt-4 h-px w-16" style={{ background: "var(--theme-gradient)" }} />
      </div>

      <input ref={inputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleFileUpload} />

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 mb-8 group"
        style={{
          borderColor: dragOver ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.25)`,
          backgroundColor: dragOver ? `rgb(var(--theme-glow) / 0.06)` : `rgb(var(--theme-glow) / 0.02)`,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}>
            <UploadCloud className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {uploading ? t("upload.processing") : t("upload.drop")}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              or <span style={{ color: "var(--theme-badge-text)" }}>{t("upload.browse")}</span>
              {" · "}{t("upload.supported")}
            </p>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loadingFiles && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-4 animate-pulse"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                <div className="space-y-2 flex-1">
                  <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                  <div className="h-2 rounded-full w-1/4" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {!loadingFiles && files.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">
            {files.length} {t("upload.count")}
          </p>
          {files.map((file) => (
            <div key={file.id}
              className="group flex items-center justify-between rounded-xl border p-4 transition-all duration-200"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.07)`;
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.3)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.03)`;
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-badge-text)" }}>
                  {getFileExt(file.name)}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatSize(file.size)} · {new Date(file.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-500/10 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={() => inputRef.current?.click()}
            className="w-full mt-2 py-3 rounded-xl border border-dashed text-sm text-muted-foreground transition-all"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.05)`;
              (e.currentTarget as HTMLButtonElement).style.color = `var(--theme-badge-text)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "";
            }}
          >
            {t("upload.more")}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loadingFiles && files.length === 0 && !uploading && (
        <p className="text-center text-sm text-muted-foreground/50 mt-4">{t("upload.empty")}</p>
      )}
    </div>
  );
};

export default UploadPage;