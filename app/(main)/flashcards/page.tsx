"use client";

import { useEffect, useState } from "react";
import { LayersIcon, LayoutGrid, FileText, ChevronDown, Sparkles, Plus } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const handleGenerate = async () => {
    const inputText = selectedFile ? selectedFile.text : pastedText;
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
        .stagger-4 { animation-delay: 240ms; }
        .stagger-5 { animation-delay: 300ms; }

        .themed-input {
          background-color: rgb(var(--theme-glow) / 0.04);
          border-color: rgb(var(--theme-glow) / 0.2);
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .themed-input:focus {
          border-color: var(--theme-primary);
          background-color: rgb(var(--theme-glow) / 0.06);
          outline: none;
        }
        .dropdown-item {
          transition: background-color 0.12s ease, color 0.12s ease;
        }
        .dropdown-item:hover {
          background-color: rgb(var(--theme-glow) / 0.08);
          color: var(--theme-badge-text);
        }
        .generate-btn {
          background: var(--theme-primary);
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: opacity 0.15s ease, filter 0.15s ease;
        }
        .generate-btn:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .generate-btn:disabled {
          opacity: 0.5;
        }
        .decks-btn {
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .decks-btn:hover {
          background-color: rgb(var(--theme-glow) / 0.06);
          color: var(--theme-badge-text);
          border-color: rgb(var(--theme-glow) / 0.3);
        }
        .noise-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
        }
        .loading-dot {
          animation: blink 1.2s infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      <div className="noise-bg" />

      {/* Top bloom */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-xl mx-auto px-6 pt-20 pb-28">

          {/* ── Header ─────────────────────────────────── */}
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

            {/* Deck count badge */}
            {deckCount > 0 && (
              <div
                className="flex items-center gap-2 mt-5 font-mono text-xs py-2 px-3 rounded-lg border w-fit"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.12)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
                }}
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

          {/* ── Deck name ──────────────────────────────── */}
          <section className="page-enter stagger-1 mb-8">
            <SectionRule label="// 01  DECK CONFIG" />
            <label
              className="block font-mono text-[10px] tracking-widest mb-2"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              {t("flash.deck_name")}
            </label>
            <input
              className="themed-input w-full rounded-xl px-4 py-3 text-sm border"
              style={{ color: "var(--foreground)" }}
              placeholder={t("flash.deck_ph")}
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
            />
          </section>

          {/* ── Source selection ───────────────────────── */}
          <section className="page-enter stagger-2 mb-8">
            <SectionRule label="// 02  SOURCE" />

            {/* File dropdown */}
            <label
              className="block font-mono text-[10px] tracking-widest mb-2"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              {t("flash.library")}
            </label>

            {loadingFiles ? (
              <div
                className="h-12 rounded-xl animate-pulse"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}
              />
            ) : (
              <div className="relative mb-5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setFileDropdownOpen((p) => !p)}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    borderColor: fileDropdownOpen
                      ? "var(--theme-primary)"
                      : `rgb(var(--theme-glow) / 0.2)`,
                    color: selectedFile ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary)" }} />
                    <span className="font-mono text-xs">
                      {selectedFile ? selectedFile.name : t("quiz.choose")}
                    </span>
                  </div>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{
                      color: `rgb(var(--theme-glow) / 0.5)`,
                      transform: fileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {fileDropdownOpen && (
                  <div
                    className="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                    }}
                  >
                    {/* Terminal bar */}
                    <div
                      className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px]"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.1)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        color: `rgb(var(--theme-glow) / 0.4)`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                      <span className="ml-2">library.sh</span>
                    </div>

                    {storedFiles.length === 0 ? (
                      <p className="text-xs font-mono text-muted-foreground px-4 py-3">
                        <span style={{ color: "var(--theme-primary)" }}>$</span> ls — no files found
                      </p>
                    ) : (
                      storedFiles.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setSelectedFile(f);
                            setPastedText("");
                            setFileDropdownOpen(false);
                          }}
                          className="dropdown-item w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-muted-foreground"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                          <span className="text-xs font-mono truncate">{f.name}</span>
                          {selectedFile?.id === f.id && (
                            <span className="ml-auto text-xs font-mono" style={{ color: "var(--theme-primary)" }}>
                              ✓
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Or divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
              <span
                className="font-mono text-[10px] tracking-widest"
                style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
              >
                OR
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
            </div>

            {/* Paste text */}
            <label
              className="block font-mono text-[10px] tracking-widest mb-2"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              {t("flash.paste")}
            </label>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}
            >
              {/* Terminal top bar */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px]"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  color: `rgb(var(--theme-glow) / 0.4)`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                <span className="ml-2">stdin.txt</span>
                {pastedText && (
                  <span className="ml-auto" style={{ color: "var(--theme-primary)" }}>
                    {pastedText.length} chars
                  </span>
                )}
              </div>
              <textarea
                className="w-full px-4 py-3 text-sm resize-none min-h-[140px] outline-none font-mono"
                style={{
                  backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                  color: "var(--foreground)",
                  caretColor: "var(--theme-primary)",
                }}
                placeholder={t("flash.placeholder")}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (e.target.value) setSelectedFile(null);
                }}
                onFocus={(e) => {
                  const wrapper = e.currentTarget.closest(".rounded-xl") as HTMLElement;
                  if (wrapper) wrapper.style.borderColor = "var(--theme-primary)";
                }}
                onBlur={(e) => {
                  const wrapper = e.currentTarget.closest(".rounded-xl") as HTMLElement;
                  if (wrapper) wrapper.style.borderColor = `rgb(var(--theme-glow) / 0.2)`;
                }}
              />
            </div>
          </section>

          {/* ── Generate ───────────────────────────────── */}
          <section className="page-enter stagger-3">
            <SectionRule label="// 03  GENERATE" />

            {error && (
              <div
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl border font-mono text-xs"
                style={{
                  borderColor: `rgb(239 68 68 / 0.3)`,
                  backgroundColor: `rgb(239 68 68 / 0.06)`,
                  color: "rgb(239 68 68)",
                }}
              >
                <span>!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="generate-btn w-full py-3.5 rounded-{3px} font-semibold text-sm flex items-center justify-center gap-2"
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
                className="decks-btn w-full mt-3 text-sm flex items-center justify-center gap-2 py-3 rounded-[3px] border text-muted-foreground font-mono"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
              >
                <LayersIcon className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
                {t("flash.view_decks")}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                    color: "var(--theme-badge-text)",
                  }}
                >
                  {deckCount}
                </span>
              </button>
            )}
          </section>

          {/* ── Footer ─────────────────────────────────── */}
          <div className="mt-16 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            <span
              className="font-mono text-[10px] tracking-[0.25em]"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
            >
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