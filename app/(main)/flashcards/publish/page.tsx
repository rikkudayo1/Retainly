"use client";

import { useEffect, useState, useRef } from "react";
import { Globe, ChevronDown, FileText, Upload } from "lucide-react";
import {
  getDecks,
  getMyPublishedDecks,
  publishDeck,
  unpublishDeck,
  deleteDeck,
  DBDeck,
  PublicDeck,
} from "@/lib/db";
import PublicDeckCard from "@/components/PublicDeckCard";
import { useLanguage } from "@/context/LanguageContext";

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

const PublishPage = () => {
  const [myDecks, setMyDecks] = useState<DBDeck[]>([]);
  const [publishedDecks, setPublishedDecks] = useState<PublicDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<DBDeck | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  useEffect(() => {
    Promise.all([getDecks(), getMyPublishedDecks()]).then(([decks, published]) => {
      setMyDecks(decks.filter((d) => !d.source_public_deck_id));
      setPublishedDecks(published);
      setLoading(false);
    });
  }, []);

  const handlePublish = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (!selectedDeck) { setError("Please select a deck."); return; }
    setError("");
    setPublishing(true);
    const { error: pubError } = await publishDeck(selectedDeck.id, title.trim(), description.trim());
    setPublishing(false);
    if (pubError) {
      setError(pubError === "Already published" ? "This deck is already published." : pubError);
      return;
    }
    const updated = await getMyPublishedDecks();
    setPublishedDecks(updated);
    setTitle("");
    setDescription("");
    setSelectedDeck(null);
    setSuccess(t("publish.success"));
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleUnpublish = async (publicDeckId: string) => {
    await unpublishDeck(publicDeckId);
    setPublishedDecks((prev) => prev.filter((d) => d.id !== publicDeckId));
  };

  const handleDelete = async (publicDeckId: string) => {
    const pub = publishedDecks.find((d) => d.id === publicDeckId);
    if (!pub) return;
    await unpublishDeck(publicDeckId);
    await deleteDeck(pub.deck_id);
    setPublishedDecks((prev) => prev.filter((d) => d.id !== publicDeckId));
    setMyDecks((prev) => prev.filter((d) => d.id !== pub.deck_id));
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40%            { opacity: 1; }
        }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1  { animation-delay: 60ms; }
        .stagger-2  { animation-delay: 120ms; }

        .themed-input {
          width: 100%;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-family: var(--font-mono, monospace);
          outline: none;
          border: 1px solid rgb(var(--theme-glow) / 0.2);
          background-color: rgb(var(--theme-glow) / 0.03);
          color: var(--foreground);
          caret-color: var(--theme-primary);
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .themed-input:focus {
          border-color: var(--theme-primary);
          background-color: rgb(var(--theme-glow) / 0.06);
        }
        .dropdown-item {
          transition: background-color 0.12s ease, color 0.12s ease;
        }
        .dropdown-item:hover {
          background-color: rgb(var(--theme-glow) / 0.08);
          color: var(--theme-badge-text);
        }
        .publish-btn {
          background: var(--theme-primary);
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: filter 0.15s ease, opacity 0.15s ease;
        }
        .publish-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .publish-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Noise */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.022,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px",
      }} />
      {/* Bloom */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 240, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-24">

          {/* ── Header ─────────────────────────────────── */}
          <div className="page-enter mb-12">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Globe className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/publish</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>share with community</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">
              {t("publish.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("publish.subtitle")}
            </p>

            {!loading && (
              <div
                className="flex items-center gap-5 mt-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.12)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
                }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>published</span>
                  <span className="font-bold text-foreground">{publishedDecks.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>drafts</span>
                  <span className="font-bold text-foreground">{myDecks.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">online</span>
                </span>
              </div>
            )}
          </div>

          {/* ── Publish form ────────────────────────────── */}
          <div className="page-enter stagger-1 mb-10" style={{ position: "relative", zIndex: 10 }}>
            <SectionRule label="// 01  NEW PUBLICATION" />

            <div
              className="rounded-2xl border overflow-visible"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.18)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
              }}
            >
              {/* Terminal chrome bar */}
              <div
                className="flex items-center gap-1.5 px-4 py-2.5 border-b font-mono text-[10px] rounded-t-2xl"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  color: `rgb(var(--theme-glow) / 0.4)`,
                }}
              >
                <span className="w-2 h-2 rounded-full bg-red-400/40" />
                <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
                <span className="w-2 h-2 rounded-full bg-green-400/40" />
                <span className="ml-3">publish.sh</span>
              </div>

              <div className="p-6 space-y-6">

                {/* Title input */}
                <div>
                  <label
                    className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
                  >
                    {t("publish.title_label")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="themed-input"
                    placeholder={t("publish.title_ph")}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  />
                </div>

                {/* Description textarea with chrome */}
                <div>
                  <label
                    className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
                  >
                    {t("publish.desc_label")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2 border-b font-mono text-[10px]"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.1)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        color: `rgb(var(--theme-glow) / 0.4)`,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                        <span className="ml-2">description.txt</span>
                      </div>
                      <span style={{ color: description.length > 270 ? "#ef4444" : `rgb(var(--theme-glow) / 0.35)` }}>
                        {description.length}/300
                      </span>
                    </div>
                    <textarea
                      className="w-full px-4 py-3 text-sm resize-none outline-none font-mono"
                      style={{
                        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                        color: "var(--foreground)",
                        minHeight: 90,
                        caretColor: "var(--theme-primary)",
                      }}
                      placeholder={t("publish.desc_ph")}
                      value={description}
                      maxLength={300}
                      onChange={(e) => { setDescription(e.target.value); setError(""); }}
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
                </div>

                {/* Deck selector */}
                <div>
                  <label
                    className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
                  >
                    {t("publish.deck_label")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>

                  <div ref={dropdownRef} className="relative" style={{ zIndex: 50 }}>
                    <button
                      onClick={() => setDropdownOpen((p) => !p)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
                      style={{
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        borderColor: dropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                        color: selectedDeck ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary)" }} />
                        {selectedDeck ? selectedDeck.title : t("publish.deck_ph")}
                      </div>
                      <ChevronDown
                        className="w-4 h-4 transition-transform duration-200"
                        style={{
                          color: `rgb(var(--theme-glow) / 0.5)`,
                          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute w-full mt-1 rounded-xl border shadow-xl"
                        style={{
                          zIndex: 200,
                          backgroundColor: "var(--background)",
                          borderColor: `rgb(var(--theme-glow) / 0.2)`,
                          maxHeight: "13rem",
                          overflowY: "auto",
                        }}
                      >
                        {/* Chrome bar — sticky so it stays visible when scrolling */}
                        <div
                          className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px] sticky top-0"
                          style={{
                            borderColor: `rgb(var(--theme-glow) / 0.1)`,
                            backgroundColor: "var(--background)",
                            color: `rgb(var(--theme-glow) / 0.4)`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                          <span className="ml-2">library.sh</span>
                        </div>

                        {myDecks.length === 0 ? (
                          <p className="text-xs font-mono text-muted-foreground px-4 py-3">
                            <span style={{ color: "var(--theme-primary)" }}>$</span> ls — no decks found
                          </p>
                        ) : (
                          myDecks.map((deck) => (
                            <button
                              key={deck.id}
                              onClick={() => { setSelectedDeck(deck); setDropdownOpen(false); setError(""); }}
                              className="dropdown-item w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-muted-foreground"
                            >
                              <div className="flex items-center gap-2 font-mono text-xs min-w-0">
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                                <span className="truncate">{deck.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className="font-mono text-[10px]"
                                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                                >
                                  {deck.cards?.length ?? 0} cards
                                </span>
                                {selectedDeck?.id === deck.id && (
                                  <span style={{ color: "var(--theme-primary)" }} className="text-xs">✓</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border font-mono text-xs"
                    style={{
                      borderColor: `rgb(239 68 68 / 0.3)`,
                      backgroundColor: `rgb(239 68 68 / 0.06)`,
                      color: "#ef4444",
                    }}
                  >
                    <span>!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border font-mono text-xs"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.25)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                      color: "var(--theme-badge-text)",
                    }}
                  >
                    <span style={{ color: "var(--theme-primary)" }}>✓</span>
                    <span>{success}</span>
                  </div>
                )}

                {/* Publish button */}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="publish-btn w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <>
                      <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
                        publishing
                      </span>
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-white inline-block"
                            style={{ animation: `blink 1.2s ${i * 0.2}s infinite` }}
                          />
                        ))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t("publish.btn")}
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>

          {/* ── Published decks ─────────────────────────── */}
          <div className="page-enter stagger-2">
            <SectionRule
              label={
                loading
                  ? "// 02  LOADING..."
                  : `// 02  YOUR PUBLICATIONS (${publishedDecks.length})`
              }
            />

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border animate-pulse h-32"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.1)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                    }}
                  />
                ))}
              </div>
            ) : publishedDecks.length === 0 ? (
              <div className="text-center py-12 font-mono">
                <div
                  className="text-xs mb-4"
                  style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                >
                  <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la published/
                  <br />
                  <span className="mt-2 block">{t("publish.empty")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("publish.empty_sub")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publishedDecks.map((deck) => (
                  <PublicDeckCard
                    key={deck.id}
                    deck={deck}
                    isOwn
                    onUnpublish={handleUnpublish}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

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

export default PublishPage;