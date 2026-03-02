"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, ChevronDown, Globe } from "lucide-react";
import {
  getPublicDecks,
  getPublicDecksCount,
  getStarredDeckIds,
  PublicDeck,
} from "@/lib/db";
import PublicDeckCard from "@/components/PublicDeckCard";
import { createClient } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/context/LanguageContext";

const LIMIT = 8;

type SortBy = "stars" | "newest" | "add_count";
type SortDir = "desc" | "asc";

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

const BrowsePage = () => {
  const { t } = useLanguage();
  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("stars");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("retainly_added_decks");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  const showGlobalToast = (message: string, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id ?? null;
    if (currentUserId && !userId) setUserId(currentUserId);

    const [data, count, starred] = await Promise.all([
      getPublicDecks(search, sortBy, sortDir, page, LIMIT),
      getPublicDecksCount(search),
      getStarredDeckIds(),
    ]);

    let ownedTitles: string[] = [];
    if (currentUserId) {
      const { data: ownDecks } = await supabase
        .from("decks").select("title").eq("user_id", currentUserId);
      ownedTitles = (ownDecks ?? []).map((d: any) => d.title);
    }

    setDecks(data.map((d) => ({ ...d, is_starred: starred.includes(d.id) })));
    setTotal(count);
    setLoading(false);

    const alreadyAddedIds = data
      .filter((d) => ownedTitles.includes(d.title) && d.user_id !== currentUserId)
      .map((d) => d.id);

    setAddedIds((prev) => {
      const merged = [...new Set([...prev, ...alreadyAddedIds])];
      sessionStorage.setItem("retainly_added_decks", JSON.stringify(merged));
      return merged;
    });
  }, [search, sortBy, sortDir, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showSortMenu]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const sortLabels: Record<SortBy, string> = {
    stars: t("browse.popularity"),
    newest: t("browse.newest"),
    add_count: t("browse.most_added"),
  };

  const getPaginationPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1  { animation-delay: 60ms; }
        .stagger-2  { animation-delay: 120ms; }
        .stagger-3  { animation-delay: 180ms; }
        .toast-enter { animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }

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
        .sort-item {
          transition: background-color 0.12s ease;
        }
        .sort-item:hover {
          background-color: rgb(var(--theme-glow) / 0.06) !important;
        }
        .page-btn {
          transition: border-color 0.12s ease, background-color 0.12s ease, filter 0.12s ease;
        }
        .page-btn:hover:not(:disabled) { filter: brightness(1.15); }
        .page-btn:disabled { opacity: 0.3; }
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
        width: 700, height: 260, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)",
      }} />

      {/* Toast */}
      {toast && (
        <div className="toast-enter fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm px-4">
          <Alert style={{
            backgroundColor: toast.error ? "rgb(239 68 68 / 0.1)" : `rgb(var(--theme-glow) / 0.12)`,
            borderColor: toast.error ? "rgb(239 68 68 / 0.3)" : `rgb(var(--theme-glow) / 0.25)`,
            backdropFilter: "blur(8px)",
          }}>
            <AlertDescription
              className="text-xs font-mono text-center"
              style={{ color: toast.error ? "#ef4444" : "var(--theme-badge-text)" }}
            >
              <span style={{ color: toast.error ? "#ef4444" : "var(--theme-primary)" }}>
                {toast.error ? "!" : "✓"}
              </span>{" "}
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24">

          {/* ── Header ─────────────────────────────────── */}
          <div className="page-enter mb-10">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Globe className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/browse</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>community decks</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">
              {t("browse.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("browse.subtitle")}
            </p>

            {/* Stats bar */}
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
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>results</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>sort</span>
                  <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>
                    {sortLabels[sortBy]}
                  </span>
                </div>
                {search && (
                  <>
                    <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>query</span>
                      <span className="font-bold" style={{ color: "var(--theme-primary)" }}>
                        "{search}"
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Search + Sort ───────────────────────────── */}
          <div className="page-enter stagger-1 mb-8" style={{ isolation: "isolate", position: "relative", zIndex: 50 }}>
            <SectionRule label="// 01  SEARCH & FILTER" />
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Search input with terminal chrome */}
              <div
                className="flex-1 rounded-xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}
              >
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
                  <span className="ml-2">search.sh</span>
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                  />
                  <input
                    className="w-full pl-10 pr-4 py-3 text-sm font-mono outline-none"
                    style={{
                      backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                      color: "var(--foreground)",
                      caretColor: "var(--theme-primary)",
                    }}
                    placeholder={t("browse.search_ph")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
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

              {/* Sort dropdown */}
              <div ref={sortMenuRef} className="relative shrink-0 sm:shrink" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowSortMenu((p) => !p)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all font-mono w-full sm:w-auto"
                  style={{
                    borderColor: showSortMenu ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: showSortMenu ? `rgb(var(--theme-glow) / 0.06)` : `rgb(var(--theme-glow) / 0.04)`,
                    color: "var(--theme-badge-text)",
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
                  <span className="text-xs">{sortLabels[sortBy]}</span>
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{
                      color: `rgb(var(--theme-glow) / 0.5)`,
                      transform: showSortMenu ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {showSortMenu && (
                  <div
                    className="absolute right-0 z-[200] mt-1 w-52 rounded-xl border shadow-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                      position: "absolute",
                    }}
                  >
                    {/* Dropdown chrome */}
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
                      <span className="ml-2">sort.sh</span>
                    </div>

                    {/* Sort by */}
                    <div className="px-3 py-2">
                      <p
                        className="font-mono text-[10px] tracking-widest mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                      >
                        {t("browse.sort")}
                      </p>
                      {(["stars", "newest", "add_count"] as SortBy[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSortBy(s); setPage(1); setShowSortMenu(false); }}
                          className="sort-item w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between"
                          style={{
                            backgroundColor: sortBy === s ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                            color: sortBy === s ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                          }}
                        >
                          {sortLabels[s]}
                          {sortBy === s && (
                            <span style={{ color: "var(--theme-primary)" }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="h-px mx-3" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />

                    {/* Direction */}
                    <div className="px-3 py-2">
                      <p
                        className="font-mono text-[10px] tracking-widest mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                      >
                        direction
                      </p>
                      {(["desc", "asc"] as SortDir[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => { setSortDir(d); setPage(1); setShowSortMenu(false); }}
                          className="sort-item w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between"
                          style={{
                            backgroundColor: sortDir === d ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                            color: sortDir === d ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                          }}
                        >
                          {d === "desc" ? t("browse.descending") : t("browse.ascending")}
                          {sortDir === d && (
                            <span style={{ color: "var(--theme-primary)" }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Deck grid ───────────────────────────────── */}
          <div className="page-enter stagger-2">
            <SectionRule
              label={
                loading
                  ? "// LOADING..."
                  : decks.length === 0
                  ? "// NO RESULTS"
                  : `// ${total} DECK${total !== 1 ? "S" : ""} FOUND`
              }
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border p-5 space-y-3 animate-pulse"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.1)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                      <div className="h-3 rounded-full flex-1" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                    </div>
                    <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                    <div className="h-2.5 rounded-full w-3/4" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                    <div className="flex gap-1.5 pt-1">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-5 w-14 rounded-full" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-16 font-mono">
                <div
                  className="text-xs mb-4"
                  style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                >
                  <span style={{ color: "var(--theme-primary)" }}>$</span>{" "}
                  search --query="{search || "*"}"
                  <br />
                  <span className="mt-2 block">
                    {t("browse.empty")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `${t("browse.empty_search")} "${search}"`
                    : t("browse.empty_sub")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {decks.map((deck) => (
                  <PublicDeckCard
                    key={deck.id}
                    deck={deck}
                    isOwn={deck.user_id === userId}
                    added={addedIds.includes(deck.id)}
                    onAdded={(id) => {
                      setAddedIds((prev) => {
                        const next = [...prev, id];
                        sessionStorage.setItem("retainly_added_decks", JSON.stringify(next));
                        return next;
                      });
                    }}
                    onToast={showGlobalToast}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination ──────────────────────────────── */}
          {totalPages > 1 && !loading && (
            <div className="page-enter stagger-3 flex items-center justify-center gap-1.5 mt-10">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                ‹
              </button>

              {getPaginationPages().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 font-mono text-xs"
                    style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="page-btn w-9 h-9 rounded-xl font-mono text-xs font-bold border"
                    style={{
                      borderColor: page === p ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: page === p ? `rgb(var(--theme-glow) / 0.12)` : `rgb(var(--theme-glow) / 0.04)`,
                      color: page === p ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                ›
              </button>
            </div>
          )}

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

export default BrowsePage;