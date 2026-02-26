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
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, DBFile } from "@/lib/db";
import MarkdownContent from "@/components/MarkdownContent";

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

/* ─── Tab config ─────────────────────────────────────────── */
const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "concepts", label: "Key Concepts", icon: <Lightbulb className="w-3.5 h-3.5" /> },
];

/* ─── Main page ──────────────────────────────────────────── */
const SummaryPage = () => {
  const { t } = useLanguage();

  // Input state
  const [inputMode, setInputMode] = React.useState<InputMode>("file");
  const [pastedText, setPastedText] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<DBFile | null>(null);
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const [storedFiles, setStoredFiles] = React.useState<DBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);

  // Output state
  const [output, setOutput] = React.useState<SummaryOutput | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("summary");

  const outputRef = React.useRef<HTMLDivElement>(null);
  const fileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    getFiles().then((data) => {
      setStoredFiles(data);
      setLoadingFiles(false);
    });
  }, []);

  // Close file menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
    };
    if (showFileMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFileMenu]);

  const canGenerate =
    !loading &&
    (inputMode === "file" ? !!selectedFile : pastedText.trim().length > 20);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const formData = new FormData();
      const text =
        inputMode === "file" ? selectedFile!.text : pastedText.trim();
      formData.append("text", text);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setOutput(data.output);
        setActiveTab("summary");
        // Scroll to output
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-2xl mx-auto px-5 pt-14 space-y-8">

        {/* ── Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `rgb(var(--theme-glow) / 0.12)` }}
            >
              <Sparkles className="w-4.5 h-4.5" style={{ color: "var(--theme-primary)" }} />
            </div>
            <h1 className="text-3xl font-black">{t("summary.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-0.5">
            {t("summary.subtitle")}
          </p>
          <div
            className="h-px w-12 mt-3"
            style={{ background: "var(--theme-gradient)" }}
          />
        </div>

        {/* ── Input card ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.18)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
          }}
        >
          {/* Mode tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.12)` }}
          >
            {(["file", "text"] as InputMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all"
                style={{
                  color:
                    inputMode === mode
                      ? "var(--theme-badge-text)"
                      : "var(--muted-foreground)",
                  backgroundColor:
                    inputMode === mode
                      ? `rgb(var(--theme-glow) / 0.07)`
                      : "transparent",
                  borderBottom:
                    inputMode === mode
                      ? `2px solid var(--theme-primary)`
                      : "2px solid transparent",
                }}
              >
                {mode === "file" ? (
                  <FileText className="w-3.5 h-3.5" />
                ) : (
                  <Clipboard className="w-3.5 h-3.5" />
                )}
                {mode === "file" ? "From File" : "Paste Text"}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* ── File mode ── */}
            {inputMode === "file" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Select a file from your library to generate a summary.
                </p>

                {/* File selector button */}
                <div ref={fileMenuRef} className="relative">
                  <button
                    onClick={() => setShowFileMenu((p) => !p)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{
                      borderColor: showFileMenu
                        ? "var(--theme-primary)"
                        : `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                      color: selectedFile
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <FileText
                        className="w-4 h-4 shrink-0"
                        style={{
                          color: selectedFile
                            ? "var(--theme-primary)"
                            : "currentColor",
                        }}
                      />
                      <span className="truncate">
                        {selectedFile ? selectedFile.name : "Choose a file…"}
                      </span>
                    </span>
                    <ChevronDown
                      className="w-4 h-4 shrink-0 transition-transform duration-200"
                      style={{
                        transform: showFileMenu ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--muted-foreground)",
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  {showFileMenu && (
                    <div
                      className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border shadow-2xl overflow-hidden"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.2)`,
                        backgroundColor: "var(--background)",
                      }}
                    >
                      {loadingFiles ? (
                        <div className="p-3 space-y-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-9 rounded-lg animate-pulse"
                              style={{
                                backgroundColor: `rgb(var(--theme-glow) / 0.07)`,
                              }}
                            />
                          ))}
                        </div>
                      ) : storedFiles.length === 0 ? (
                        <div className="px-4 py-5 text-center">
                          <p className="text-sm text-muted-foreground">
                            No files uploaded yet.
                          </p>
                        </div>
                      ) : (
                        <div className="p-1.5 max-h-52 overflow-y-auto">
                          {storedFiles.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => {
                                setSelectedFile(file);
                                setShowFileMenu(false);
                              }}
                              className="w-full text-left text-sm px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all"
                              style={{
                                backgroundColor:
                                  selectedFile?.id === file.id
                                    ? `rgb(var(--theme-glow) / 0.1)`
                                    : "transparent",
                                color:
                                  selectedFile?.id === file.id
                                    ? "var(--theme-badge-text)"
                                    : "var(--muted-foreground)",
                              }}
                              onMouseEnter={(e) => {
                                if (selectedFile?.id !== file.id)
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                    `rgb(var(--theme-glow) / 0.06)`;
                              }}
                              onMouseLeave={(e) => {
                                if (selectedFile?.id !== file.id)
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                    "transparent";
                              }}
                            >
                              <FileText
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: "var(--theme-primary)" }}
                              />
                              <span className="truncate">{file.name}</span>
                              {selectedFile?.id === file.id && (
                                <Check
                                  className="w-3.5 h-3.5 ml-auto shrink-0"
                                  style={{ color: "var(--theme-primary)" }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected file info chip */}
                {selectedFile && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                      color: "var(--theme-badge-text)",
                    }}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                    <span className="truncate flex-1">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="shrink-0 hover:opacity-60 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Text mode ── */}
            {inputMode === "text" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Paste any text, paragraph, or notes below.
                </p>
                <textarea
                  className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/40 leading-relaxed"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    color: "var(--foreground)",
                    minHeight: 160,
                  }}
                  placeholder="Paste your text here…"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                      "var(--theme-primary)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                      `rgb(var(--theme-glow) / 0.2)`;
                  }}
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground/40">
                    {pastedText.trim().length} characters
                    {pastedText.trim().length > 0 && pastedText.trim().length < 20 && (
                      <span className="text-amber-500 ml-1">(too short)</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* ── Generate button ── */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canGenerate ? "var(--theme-gradient)" : `rgb(var(--theme-glow) / 0.1)`,
                color: canGenerate ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
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

        {/* ── Error state ── */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm"
            style={{
              borderColor: `rgb(239 68 68 / 0.3)`,
              backgroundColor: `rgb(239 68 68 / 0.07)`,
              color: `rgb(239 68 68)`,
            }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            <div
              className="h-5 w-32 rounded-full animate-pulse"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
            />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div
                  className="h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.07)`,
                    width: `${70 + (i % 3) * 10}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
                <div
                  className="h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                    width: `${50 + (i % 4) * 12}%`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Output area ── */}
        {output && !loading && (
          <div ref={outputRef} className="space-y-5">
            {/* Output header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-5 rounded-full"
                  style={{ background: "var(--theme-gradient)" }}
                />
                <h2 className="text-base font-black">Results</h2>
                {(inputMode === "file" ? selectedFile?.name : null) && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                      color: "var(--theme-badge-text)",
                    }}
                  >
                    {selectedFile?.name}
                  </span>
                )}
              </div>
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    `rgb(var(--theme-glow) / 0.08)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl border"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.12)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor:
                      activeTab === tab.id
                        ? `rgb(var(--theme-glow) / 0.12)`
                        : "transparent",
                    color:
                      activeTab === tab.id
                        ? "var(--theme-badge-text)"
                        : "var(--muted-foreground)",
                    boxShadow:
                      activeTab === tab.id
                        ? `0 0 0 1px rgb(var(--theme-glow) / 0.2)`
                        : "none",
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-4">

              {/* Summary tab */}
              {activeTab === "summary" && (
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.15)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                  }}
                >
                  <MarkdownContent content={output.summary} />
                </div>
              )}

              {/* Key Concepts tab */}
              {activeTab === "concepts" && (
                <div className="space-y-3">
                  {output.key_concepts.map((concept, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-4 flex gap-4"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.15)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                        style={{
                          background: `rgb(var(--theme-glow) / 0.12)`,
                          color: "var(--theme-primary)",
                        }}
                      >
                        {i + 1}
                      </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;