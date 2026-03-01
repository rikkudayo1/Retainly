"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, UploadCloud, FileText, FileType, File } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, saveFile, deleteFile, DBFile } from "@/lib/db";
import { extractText } from "unpdf";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const getFileExt = (name: string) => name.split(".").pop()?.toLowerCase() || "file";

const FileIcon = ({ ext }: { ext: string }) => {
  if (ext === "pdf") return <FileType className="w-4 h-4" />;
  if (ext === "md") return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

// Simulated terminal mount lines
const MOUNT_LINES = [
  "mounting filesystem...",
  "checking integrity...",
  "indexing content...",
  "extracting text layer...",
  "ready.",
];

const MountingAnimation = ({ filename }: { filename: string }) => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex(prev => {
        if (prev >= MOUNT_LINES.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 420);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-xl border p-5 font-mono text-xs space-y-1.5"
      style={{
        borderColor: `rgb(var(--theme-glow) / 0.2)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: "var(--theme-primary)" }}>
        <span>$</span>
        <span>mount <span className="text-foreground/70">{filename}</span></span>
      </div>
      {MOUNT_LINES.slice(0, lineIndex + 1).map((line, i) => (
        <div key={i} className="flex items-center gap-3">
          <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
            {i < lineIndex ? "✓" : "›"}
          </span>
          <span style={{
            color: i < lineIndex
              ? `rgb(var(--theme-glow) / 0.5)`
              : "var(--theme-badge-text)"
          }}>
            {line}
          </span>
          {i === lineIndex && i < MOUNT_LINES.length - 1 && (
            <span
              className="inline-block w-1.5 h-3 animate-pulse"
              style={{ backgroundColor: "var(--theme-primary)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const UploadPage = () => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<DBFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFiles().then((data) => {
      setFiles(data);
      setLoadingFiles(false);
    });
  }, []);

  const processFile = async (selected: File) => {
    setUploading(true);
    setUploadingName(selected.name);
    try {
      let text = "";

      if (selected.type === "application/pdf") {
        const buffer = await selected.arrayBuffer();
        const { text: extractedText } = await extractText(
          new Uint8Array(buffer),
          { mergePages: true }
        );
        text = extractedText;
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
      setUploadingName("");
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
    setDeletingId(id);
    await deleteFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDeletingId(null);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes deleteOut {
          to { opacity: 0; transform: translateX(12px); max-height: 0; padding: 0; margin: 0; }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .row-enter  { animation: rowIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        .row-delete { animation: deleteOut 0.25s ease forwards; }

        .drop-zone {
          transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          transform: scale(1.005);
        }
        .file-row {
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .file-row:hover {
          background-color: rgb(var(--theme-glow) / 0.06) !important;
          border-color: rgb(var(--theme-glow) / 0.25) !important;
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-24">

          {/* ── Header ──────────────────────────────────── */}
          <div className="page-enter mb-12">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-6"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <span style={{ color: "var(--theme-primary)" }}>$</span>
              <span>~/retainly/library</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">
              {t("upload.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("upload.subtitle")}
            </p>

            {/* Stats bar */}
            {!loadingFiles && files.length > 0 && (
              <div
                className="flex items-center gap-5 mt-6 font-mono text-xs py-3 px-4 rounded-lg border w-fit"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.12)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
                }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  files <span className="text-foreground font-bold">{files.length}</span>
                </span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  total <span className="text-foreground font-bold">{formatSize(totalSize)}</span>
                </span>
              </div>
            )}
          </div>

          {/* ── Drop zone ───────────────────────────────── */}
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`drop-zone page-enter rounded-2xl border-2 border-dashed cursor-pointer mb-6 overflow-hidden ${dragOver ? "drag-over" : ""}`}
            style={{
              animationDelay: "60ms",
              borderColor: dragOver
                ? "var(--theme-primary)"
                : `rgb(var(--theme-glow) / 0.2)`,
              backgroundColor: dragOver
                ? `rgb(var(--theme-glow) / 0.06)`
                : `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            {/* Top terminal bar */}
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 border-b font-mono text-[10px]"
              style={{
                borderColor: dragOver
                  ? `rgb(var(--theme-glow) / 0.2)`
                  : `rgb(var(--theme-glow) / 0.1)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                color: `rgb(var(--theme-glow) / 0.4)`,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-400/40" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
              <span className="w-2 h-2 rounded-full bg-green-400/40" />
              <span className="ml-3">drop_zone.sh</span>
            </div>

            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                  transform: dragOver ? "scale(1.1) rotate(-3deg)" : "scale(1)",
                }}
              >
                <UploadCloud
                  className="w-8 h-8"
                  style={{ color: "var(--theme-primary)" }}
                />
              </div>

              <div>
                <p className="font-bold text-base text-foreground mb-1">
                  {dragOver
                    ? "release to mount"
                    : t("upload.drop")}
                </p>
                <p className="text-sm text-muted-foreground">
                  or{" "}
                  <span
                    className="font-mono underline underline-offset-2"
                    style={{ color: "var(--theme-badge-text)" }}
                  >
                    {t("upload.browse")}
                  </span>
                  {" · "}
                  <span className="font-mono text-xs">.txt .md .pdf</span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Upload progress ─────────────────────────── */}
          {uploading && (
            <div className="mb-6 page-enter">
              <MountingAnimation filename={uploadingName} />
            </div>
          )}

          {/* ── File list header ─────────────────────────── */}
          {!loadingFiles && files.length > 0 && (
            <div
              className="page-enter"
              style={{ animationDelay: "120ms" }}
            >
              {/* Column headers */}
              <div
                className="flex items-center gap-4 px-4 mb-2 font-mono text-[10px] tracking-widest"
                style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
              >
                <span className="w-8 shrink-0">TYPE</span>
                <span className="flex-1">NAME</span>
                <span className="w-16 text-right hidden sm:block">SIZE</span>
                <span className="w-24 text-right hidden md:block">UPLOADED</span>
                <span className="w-8" />
              </div>

              {/* Divider */}
              <div
                className="h-px mb-3"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
              />

              {/* File rows */}
              <div className="space-y-1.5">
                {files.map((file, i) => {
                  const ext = getFileExt(file.name);
                  const isDeleting = deletingId === file.id;
                  return (
                    <div
                      key={file.id}
                      className={`file-row group flex items-center gap-4 px-4 py-3 rounded-xl border row-enter ${isDeleting ? "row-delete" : ""}`}
                      style={{
                        animationDelay: `${i * 40}ms`,
                        borderColor: `rgb(var(--theme-glow) / 0.1)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                      }}
                    >
                      {/* Type badge */}
                      <div
                        className="w-8 shrink-0 flex items-center justify-center"
                        style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
                      >
                        <FileIcon ext={ext} />
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="font-mono text-[10px] mt-0.5 sm:hidden"
                          style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                          {formatSize(file.size)}
                        </p>
                      </div>

                      {/* Size */}
                      <span
                        className="w-16 text-right font-mono text-xs hidden sm:block"
                        style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
                      >
                        {formatSize(file.size)}
                      </span>

                      {/* Date */}
                      <span
                        className="w-24 text-right font-mono text-[10px] hidden md:block"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                      >
                        {new Date(file.uploaded_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="w-8 flex items-center justify-center transition-all duration-150 rounded-lg p-1.5 hover:bg-red-500/10"
                        style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                        onMouseEnter={e => (e.currentTarget.style.color = "rgb(239 68 68)")}
                        onMouseLeave={e => (e.currentTarget.style.color = `rgb(var(--theme-glow) / 0.4)`)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add more */}
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full mt-4 py-3 rounded-xl border border-dashed font-mono text-xs transition-all duration-150"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.15)`,
                  color: `rgb(var(--theme-glow) / 0.4)`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.35)`;
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-badge-text)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.04)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                  (e.currentTarget as HTMLButtonElement).style.color = `rgb(var(--theme-glow) / 0.4)`;
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                + {t("upload.more")}
              </button>
            </div>
          )}

          {/* ── Skeleton ────────────────────────────────── */}
          {loadingFiles && (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border animate-pulse"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.08)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                  }}
                >
                  <div className="w-8 h-4 rounded" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.07)` }} />
                  <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.07)`, maxWidth: `${30 + i * 15}%` }} />
                  <div className="w-12 h-3 rounded-full hidden sm:block" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.05)` }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ─────────────────────────────── */}
          {!loadingFiles && files.length === 0 && !uploading && (
            <div
              className="text-center py-8 font-mono text-xs"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
            >
              <span style={{ color: "var(--theme-primary)" }}>$</span>{" "}
              ls -la
              <br />
              <span className="mt-2 block">{t("upload.empty")}</span>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default UploadPage;