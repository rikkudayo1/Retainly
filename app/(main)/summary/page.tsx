"use client";

import * as React from "react";
import {
  FileText,
  ChevronDown,
  Sparkles,
  X,
  Clipboard,
  BookOpen,
  Lightbulb,
  Loader2,
  Check,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, DBFile } from "@/lib/db";
import MarkdownContent from "@/components/MarkdownContent";
import ImageAttachment, { ImageState } from "@/components/ImageAttachment";

/* ─── Types ──────────────────────────────────────────────── */
interface KeyConcept {
  term: string;
  definition: string;
}

interface SummaryOutput {
  summary: string;
  key_concepts: KeyConcept[];
}

type InputMode = "file" | "text";
type ActiveTab = "summary" | "concepts";

/* ─── Main page ──────────────────────────────────────────── */
const SummaryPage = () => {
  const { t } = useLanguage();

  const [inputMode, setInputMode] = React.useState<InputMode>("file");
  const [pastedText, setPastedText] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<DBFile | null>(null);
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const [storedFiles, setStoredFiles] = React.useState<DBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);
  const [image, setImage] = React.useState<ImageState>(null);

  const [output, setOutput] = React.useState<SummaryOutput | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("summary");

  const outputRef = React.useRef<HTMLDivElement>(null);
  const fileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    getFiles().then((data) => { setStoredFiles(data); setLoadingFiles(false); });
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node))
        setShowFileMenu(false);
    };
    if (showFileMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFileMenu]);

  const canGenerate =
    !loading &&
    (image !== null ||
      (inputMode === "file" ? !!selectedFile : pastedText.trim().length > 20));

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const formData = new FormData();
      if (image) {
        formData.append("imageBase64", image.base64);
        formData.append("imageMimeType", image.mimeType);
      } else {
        const text = inputMode === "file" ? selectedFile!.text : pastedText.trim();
        formData.append("text", text);
      }

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setOutput(data.output);
        setActiveTab("summary");
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setOutput(null);
    setError(null);
    setPastedText("");
    setSelectedFile(null);
    setImage(null);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes conceptIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .concept-enter { animation: conceptIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }

        .mode-tab {
          transition: color 0.15s, background-color 0.15s, border-color 0.15s;
        }
        .output-tab {
          transition: background-color 0.15s, color 0.15s;
        }
        .file-option {
          transition: background-color 0.12s;
        }
        .skeleton-pulse {
          background: linear-gradient(
            90deg,
            rgb(var(--theme-glow) / 0.06) 0%,
            rgb(var(--theme-glow) / 0.1) 50%,
            rgb(var(--theme-glow) / 0.06) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground pb-24">
        <div className="max-w-2xl mx-auto px-5 pt-14 space-y-8">

          {/* ── Header ──────────────────────────────────── */}
          <div className="page-enter space-y-3">
            <div
              className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/summary</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">
              {t("summary.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t("summary.subtitle")}
            </p>
          </div>

          {/* ── Input card ──────────────────────────────── */}
          <div
            className="page-enter rounded-2xl border overflow-hidden"
            style={{
              animationDelay: "60ms",
              borderColor: `rgb(var(--theme-glow) / 0.15)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            {/* Terminal titlebar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.1)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/50" />
                <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
                <span className="w-2 h-2 rounded-full bg-green-400/50" />
                <span
                  className="ml-3 font-mono text-[10px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                >
                  generate_summary.sh
                </span>
              </div>

              {/* Mode toggle — inline in titlebar */}
              <div
                className="flex items-center rounded-lg border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
              >
                {(["file", "text"] as InputMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className="mode-tab flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wide"
                    style={{
                      backgroundColor: inputMode === mode
                        ? `rgb(var(--theme-glow) / 0.12)`
                        : "transparent",
                      color: inputMode === mode
                        ? "var(--theme-badge-text)"
                        : `rgb(var(--theme-glow) / 0.4)`,
                      borderRight: mode === "file" ? `1px solid rgb(var(--theme-glow) / 0.1)` : "none",
                    }}
                  >
                    {mode === "file"
                      ? <FileText className="w-3 h-3" />
                      : <Clipboard className="w-3 h-3" />}
                    {mode === "file" ? "from_file" : "paste_text"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* ── File mode ── */}
              {inputMode === "file" && (
                <div className="space-y-3">
                  <p
                    className="font-mono text-[11px]"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                  >
                    // select a file from your library
                  </p>

                  <div ref={fileMenuRef} className="relative">
                    <button
                      onClick={() => setShowFileMenu((p) => !p)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-150"
                      style={{
                        borderColor: showFileMenu
                          ? "var(--theme-primary)"
                          : `rgb(var(--theme-glow) / 0.18)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        color: selectedFile ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <FileText
                          className="w-4 h-4 shrink-0"
                          style={{ color: selectedFile ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.35)` }}
                        />
                        <span className="truncate font-mono text-xs">
                          {selectedFile ? selectedFile.name : "choose_file..."}
                        </span>
                      </span>
                      <ChevronDown
                        className="w-4 h-4 shrink-0 transition-transform duration-200"
                        style={{
                          transform: showFileMenu ? "rotate(180deg)" : "rotate(0deg)",
                          color: `rgb(var(--theme-glow) / 0.4)`,
                        }}
                      />
                    </button>

                    {/* Dropdown */}
                    {showFileMenu && (
                      <div
                        className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border shadow-2xl overflow-hidden"
                        style={{
                          borderColor: `rgb(var(--theme-glow) / 0.18)`,
                          backgroundColor: "var(--background)",
                        }}
                      >
                        {/* Dropdown titlebar */}
                        <div
                          className="px-3 py-2 border-b font-mono text-[10px]"
                          style={{
                            borderColor: `rgb(var(--theme-glow) / 0.08)`,
                            color: `rgb(var(--theme-glow) / 0.35)`,
                            backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                          }}
                        >
                          // library
                        </div>

                        {loadingFiles ? (
                          <div className="p-2.5 space-y-1.5">
                            {[1, 2].map((i) => (
                              <div key={i} className="h-8 rounded-lg skeleton-pulse" />
                            ))}
                          </div>
                        ) : storedFiles.length === 0 ? (
                          <div className="px-4 py-5 text-center">
                            <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                              // no files found
                            </p>
                          </div>
                        ) : (
                          <div className="p-1.5 max-h-52 overflow-y-auto">
                            {storedFiles.map((file) => (
                              <button
                                key={file.id}
                                onClick={() => { setSelectedFile(file); setShowFileMenu(false); }}
                                className="file-option w-full text-left font-mono text-xs px-3 py-2.5 rounded-lg flex items-center gap-2.5"
                                style={{
                                  backgroundColor: selectedFile?.id === file.id
                                    ? `rgb(var(--theme-glow) / 0.1)`
                                    : "transparent",
                                  color: selectedFile?.id === file.id
                                    ? "var(--theme-badge-text)"
                                    : "var(--muted-foreground)",
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedFile?.id !== file.id)
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`;
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedFile?.id !== file.id)
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                                }}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                                <span className="truncate">{file.name}</span>
                                {selectedFile?.id === file.id && (
                                  <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: "var(--theme-primary)" }} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected file chip */}
                  {selectedFile && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.18)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                        color: "var(--theme-badge-text)",
                      }}
                    >
                      <span style={{ color: "var(--theme-primary)" }}>›</span>
                      <span className="truncate flex-1">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} className="shrink-0 hover:opacity-60 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Text mode ── */}
              {inputMode === "text" && (
                <div className="space-y-2">
                  <p
                    className="font-mono text-[11px]"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                  >
                    // paste any text, paragraphs, or notes
                  </p>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.18)` }}
                  >
                    {/* Textarea prompt line */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 border-b font-mono text-[10px]"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.08)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        color: `rgb(var(--theme-glow) / 0.35)`,
                      }}
                    >
                      <span style={{ color: "var(--theme-primary)" }}>$</span>
                      <span>stdin</span>
                    </div>
                    <textarea
                      className="w-full resize-none px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/30 leading-relaxed bg-transparent"
                      style={{
                        color: "var(--foreground)",
                        minHeight: 160,
                      }}
                      placeholder="paste your text here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                    >
                      {pastedText.trim().length} chars
                      {pastedText.trim().length > 0 && pastedText.trim().length < 20 && (
                        <span className="text-amber-500 ml-2">// too short</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Image attachment ── */}
              <ImageAttachment
                selectedImage={image}
                onImageSelect={(base64, mimeType, name) => setImage({ base64, mimeType, name })}
                onImageClear={() => setImage(null)}
                disabled={loading}
              />

              {/* ── Generate button ── */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-35"
                style={{
                  background: canGenerate ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.08)`,
                  color: canGenerate ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-mono">generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Error ───────────────────────────────────── */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl border px-4 py-3.5 font-mono text-xs"
              style={{
                borderColor: `rgb(239 68 68 / 0.25)`,
                backgroundColor: `rgb(239 68 68 / 0.05)`,
                color: `rgb(239 68 68)`,
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// error: </span>
                {error}
              </div>
            </div>
          )}

          {/* ── Loading skeleton ─────────────────────────── */}
          {loading && (
            <div className="space-y-5">
              <div
                className="flex items-center gap-2 font-mono text-[11px]"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
              >
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} />
                <span>processing input...</span>
              </div>
              <div className="space-y-3">
                {[90, 75, 85, 60, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full skeleton-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
              />
              <div className="space-y-2">
                {[50, 65, 45].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full skeleton-pulse"
                    style={{ width: `${w}%`, animationDelay: `${(i + 5) * 100}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Output ──────────────────────────────────── */}
          {output && !loading && (
            <div ref={outputRef} className="space-y-5 page-enter">

              {/* Output section rule */}
              <div className="flex items-center gap-4">
                <span
                  className="font-mono text-[10px] tracking-[0.2em] shrink-0"
                  style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
                >
                  // OUTPUT
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                {selectedFile?.name && (
                  <span
                    className="font-mono text-[10px] shrink-0"
                    style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                  >
                    {selectedFile.name}
                  </span>
                )}
                <button
                  onClick={handleClear}
                  className="shrink-0 flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-all"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.15)`,
                    color: `rgb(var(--theme-glow) / 0.4)`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.3)`;
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-badge-text)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                    (e.currentTarget as HTMLButtonElement).style.color = `rgb(var(--theme-glow) / 0.4)`;
                  }}
                >
                  <X className="w-3 h-3" /> clear
                </button>
              </div>

              {/* Output tab selector */}
              <div
                className="flex border rounded-xl overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.12)` }}
              >
                {[
                  { id: "summary" as ActiveTab, label: "summary", icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { id: "concepts" as ActiveTab, label: "key_concepts", icon: <Lightbulb className="w-3.5 h-3.5" /> },
                ].map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="output-tab flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs"
                    style={{
                      backgroundColor: activeTab === tab.id
                        ? `rgb(var(--theme-glow) / 0.08)`
                        : "transparent",
                      color: activeTab === tab.id
                        ? "var(--theme-badge-text)"
                        : `rgb(var(--theme-glow) / 0.4)`,
                      borderRight: i === 0 ? `1px solid rgb(var(--theme-glow) / 0.1)` : "none",
                      borderBottom: activeTab === tab.id
                        ? `2px solid var(--theme-primary)`
                        : "2px solid transparent",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Summary tab */}
              {activeTab === "summary" && (
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.12)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                  }}
                >
                  <MarkdownContent content={output.summary} />
                </div>
              )}

              {/* Key concepts tab */}
              {activeTab === "concepts" && (
                <div className="space-y-2.5">
                  {output.key_concepts.map((concept, i) => (
                    <div
                      key={i}
                      className="concept-enter rounded-2xl border flex gap-4 p-4"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        borderColor: `rgb(var(--theme-glow) / 0.12)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                      }}
                    >
                      {/* Index */}
                      <div
                        className="font-mono text-[10px] tracking-widest pt-1 shrink-0 w-6 text-right"
                        style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      <div
                        className="w-px self-stretch"
                        style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
                      />

                      <div className="space-y-1 min-w-0">
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--theme-badge-text)" }}
                        >
                          {concept.term}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.definition}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default SummaryPage;