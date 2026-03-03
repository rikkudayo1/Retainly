"use client";

import { useEffect, useState } from "react";
import { LayersIcon, LayoutGrid, FileText, ChevronDown, Plus, X, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, getDecks, saveDeck, DBFile, logActivity } from "@/lib/db";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

const FlashcardsPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [storedFiles, setStoredFiles] = useState<DBFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DBFile | null>(null);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckCount, setDeckCount] = useState(0);

  const hasInput = !!(selectedFile || pastedText.trim());

  useEffect(() => {
    Promise.all([getFiles(), getDecks()]).then(([files, decks]) => {
      setStoredFiles(files);
      setDeckCount(decks.length);
      setLoadingFiles(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setFileDropdownOpen(false);
    if (fileDropdownOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fileDropdownOpen]);

  const buildInputText = () => {
    const fileText = selectedFile?.text?.trim() ?? "";
    const extra = pastedText.trim();
    if (fileText && extra) {
      return `${fileText}\n\n---\nAdditional context / instructions:\n${extra}`;
    }
    return fileText || extra;
  };

  const handleGenerate = async () => {
    const inputText = buildInputText();
    if (!inputText.trim()) {
      setError(t("flash.error.empty"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", inputText);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const rawCards = data.output.flashcards as {
          keyword: string;
          hint: string;
          explanation: string;
        }[];
        const title = deckTitle.trim() || selectedFile?.name || "Untitled Deck";
        const newDeck = await saveDeck(title, rawCards);
        if (!newDeck) { setError(t("flash.error.failed")); return; }
        await logActivity();
        router.push(`/flashcards/study?id=${newDeck.id}`);
      } else {
        setError(data.error || t("flash.error.failed"));
      }
    } catch (err: any) {
      setError(err.message || t("flash.error.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .stagger-1 { animation-delay: 60ms; }
        .stagger-2 { animation-delay: 120ms; }
        .stagger-3 { animation-delay: 180ms; }
        .skeleton-pulse {
          background: linear-gradient(90deg, rgb(var(--theme-glow)/0.06) 0%, rgb(var(--theme-glow)/0.1) 50%, rgb(var(--theme-glow)/0.06) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .generate-btn {
          background: var(--theme-primary);
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: opacity 0.15s ease, filter 0.15s ease;
        }
        .generate-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .generate-btn:disabled { opacity: 0.5; }
        .decks-btn {
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .decks-btn:hover {
          background-color: rgb(var(--theme-glow) / 0.06);
          color: var(--theme-badge-text);
          border-color: rgb(var(--theme-glow) / 0.3);
        }
        .noise-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 128px 128px;
        }
        .loading-dot { animation: blink 1.2s infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      `}</style>

      <div className="noise-bg" />

      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)` }}
      />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-xl mx-auto px-6 pt-20 pb-28">

          {/* ── Header ── */}
          <section className="page-enter mb-10">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <LayoutGrid className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/flashcards</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>new deck</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">
              {t("flash.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("flash.subtitle")}
            </p>
            {deckCount > 0 && (
              <div
                className="flex items-center gap-2 mt-5 font-mono text-xs py-2 px-3 rounded-lg border w-fit"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.025)` }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>decks</span>
                <span className="font-bold text-foreground">{deckCount}</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">active</span>
                </span>
              </div>
            )}
          </section>

          {/* ── Main card ── */}
          <div
            className="page-enter stagger-1 rounded-2xl border overflow-hidden"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
          >
            {/* Terminal titlebar */}
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 border-b"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
            >
              <span className="w-2 h-2 rounded-full bg-red-400/50" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
              <span className="w-2 h-2 rounded-full bg-green-400/50" />
              <span className="ml-3 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                generate_deck.sh
              </span>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Deck name ── */}
              <div className="space-y-1.5">
                <p className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  // deck_config
                </p>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 border-b font-mono text-[10px]"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.35)` }}
                  >
                    <span style={{ color: "var(--theme-primary)" }}>$</span>
                    <span>{t("flash.deck_name")}</span>
                  </div>
                  <input
                    className="w-full px-4 py-2.5 text-sm outline-none bg-transparent placeholder:text-muted-foreground/30"
                    style={{ color: "var(--foreground)" }}
                    placeholder={t("flash.deck_ph")}
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// source</span>
                <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
              </div>

              {/* ── Source block ── */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
              >
                {/* Block titlebar */}
                <div
                  className="flex items-center gap-2 px-3 py-2 border-b font-mono text-[10px]"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.35)` }}
                >
                  <span style={{ color: "var(--theme-primary)" }}>$</span>
                  <span>source</span>
                  {selectedFile && pastedText.trim() && (
                    <span
                      className="ml-auto px-1.5 py-0.5 rounded text-[9px]"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-primary)" }}
                    >
                      file + text active
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-3">

                  {/* File picker */}
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                      // from_library
                    </p>
                    {loadingFiles ? (
                      <div className="h-9 rounded-lg skeleton-pulse" />
                    ) : (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {selectedFile ? (
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                            style={{ borderColor: "var(--theme-primary)", backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                            <span className="font-mono text-xs flex-1 truncate" style={{ color: "var(--foreground)" }}>
                              {selectedFile.name}
                            </span>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="shrink-0 p-0.5 rounded transition-all hover:opacity-70"
                              style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setFileDropdownOpen((p) => !p)}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2 border font-mono text-xs transition-all"
                            style={{
                              backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                              borderColor: fileDropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.18)`,
                              color: "var(--muted-foreground)",
                            }}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.35)` }} />
                              choose_file...
                            </span>
                            <ChevronDown
                              className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                              style={{ transform: fileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }}
                            />
                          </button>
                        )}

                        {fileDropdownOpen && !selectedFile && (
                          <div
                            className="absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden"
                            style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.18)` }}
                          >
                            <div
                              className="px-3 py-2 border-b font-mono text-[10px]"
                              style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, color: `rgb(var(--theme-glow) / 0.35)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
                            >
                              // library
                            </div>
                            {storedFiles.length === 0 ? (
                              <p className="font-mono text-xs px-4 py-3" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                                // no files found
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto p-1.5">
                                {storedFiles.map((f) => (
                                  <button
                                    key={f.id}
                                    onClick={() => { setSelectedFile(f); setFileDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-all"
                                    style={{ color: "var(--muted-foreground)", backgroundColor: "transparent" }}
                                    onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`}
                                    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
                                  >
                                    <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                                    <span className="truncate">{f.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contextual divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                    <span className="font-mono text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>
                      {selectedFile ? "// additional_context" : "// or_paste_text"}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                  </div>

                  {/* Paste textarea */}
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                      {selectedFile ? "// extra_instructions_or_data (optional)" : "// paste_text"}
                    </p>
                    <div
                      className="rounded-lg border overflow-hidden"
                      style={{ borderColor: `rgb(var(--theme-glow) / 0.12)` }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 border-b font-mono text-[10px]"
                        style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)`, color: `rgb(var(--theme-glow) / 0.3)` }}
                      >
                        <span style={{ color: "var(--theme-primary)" }}>$</span>
                        <span>stdin</span>
                        {selectedFile && (
                          <span className="ml-auto text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                            appended after file
                          </span>
                        )}
                        {!selectedFile && pastedText && (
                          <span className="ml-auto" style={{ color: "var(--theme-primary)" }}>
                            {pastedText.length} chars
                          </span>
                        )}
                      </div>
                      <textarea
                        className="w-full resize-none px-4 py-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground/30 leading-relaxed font-mono"
                        style={{
                          color: "var(--foreground)",
                          minHeight: selectedFile ? "80px" : "120px",
                          transition: "min-height 0.2s ease",
                          caretColor: "var(--theme-primary)",
                        }}
                        placeholder={
                          selectedFile
                            ? "e.g. focus on chapter 3, make it harder, add more cards..."
                            : t("flash.placeholder")
                        }
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Active inputs summary */}
                  {hasInput && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[10px]"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)`, border: `1px solid rgb(var(--theme-glow) / 0.08)` }}
                    >
                      <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// input:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedFile && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-primary)" }}
                          >
                            <FileText className="w-2.5 h-2.5" /> {selectedFile.name}
                          </span>
                        )}
                        {selectedFile && pastedText.trim() && (
                          <span style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>+</span>
                        )}
                        {pastedText.trim() && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: `rgb(var(--theme-glow) / 0.6)` }}
                          >
                            stdin ({pastedText.trim().length} chars)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border font-mono text-xs"
                  style={{ borderColor: `rgb(239 68 68 / 0.3)`, backgroundColor: `rgb(239 68 68 / 0.06)`, color: "rgb(239 68 68)" }}
                >
                  <span>!</span><span>{error}</span>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !hasInput}
                className="generate-btn w-full py-3 rounded-[3px] font-semibold text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
                      generating
                    </span>
                    <span className="flex gap-0.5">
                      <span className="loading-dot w-1 h-1 rounded-full bg-white" />
                      <span className="loading-dot w-1 h-1 rounded-full bg-white" />
                      <span className="loading-dot w-1 h-1 rounded-full bg-white" />
                    </span>
                  </>
                ) : (
                  <div className="flex items-center font-mono gap-3">
                    <Plus className="w-4 h-4" />
                    {t("flash.generate")}
                  </div>
                )}
              </button>

              {/* View decks */}
              {deckCount > 0 && (
                <button
                  onClick={() => router.push("/flashcards/decks")}
                  className="decks-btn w-full text-sm flex items-center justify-center gap-2 py-3 rounded-[3px] border text-muted-foreground font-mono"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
                >
                  <LayersIcon className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
                  {t("flash.view_decks")}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-badge-text)" }}
                  >
                    {deckCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="mt-16 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
              RETAINLY
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default FlashcardsPage;