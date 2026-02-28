"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("retainly_added_decks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);

  const showGlobalToast = (message: string, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const load = useCallback(async () => {
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
        .from("decks")
        .select("title")
        .eq("user_id", currentUserId);
      ownedTitles = (ownDecks ?? []).map((d: any) => d.title);
    }

    const decksWithCorrectStars = data.map((d) => ({
      ...d,
      is_starred: starred.includes(d.id),
    }));

    setDecks(decksWithCorrectStars);
    setTotal(count);
    setLoading(false);

    const alreadyAddedIds = data
      .filter(
        (d) => ownedTitles.includes(d.title) && d.user_id !== currentUserId,
      )
      .map((d) => d.id);

    setAddedIds((prev) => {
      const merged = [...new Set([...prev, ...alreadyAddedIds])];
      sessionStorage.setItem("retainly_added_decks", JSON.stringify(merged));
      return merged;
    });
  }, [search, sortBy, sortDir, page]);

  useEffect(() => { load(); }, [load]);

  // Close sort menu on outside click
  useEffect(() => {
    const close = () => setShowSortMenu(false);
    if (showSortMenu) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showSortMenu]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

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
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-4xl mx-auto">
      {/* Global toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm px-4">
          <Alert
            style={{
              backgroundColor: toast.error
                ? "rgb(239 68 68 / 0.1)"
                : `rgb(var(--theme-glow) / 0.12)`,
              borderColor: toast.error
                ? "rgb(239 68 68 / 0.3)"
                : `rgb(var(--theme-glow) / 0.25)`,
              backdropFilter: "blur(8px)",
            }}
          >
            <AlertDescription
              className="text-xs font-medium text-center"
              style={{
                color: toast.error ? "#ef4444" : "var(--theme-badge-text)",
              }}
            >
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">{t("browse.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("browse.subtitle")}
        </p>
        <div
          className="mt-4 h-px w-16"
          style={{ background: "var(--theme-primary)" }}
        />
      </div>

      {/* Search + Sort row */}
      <div className="flex gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--theme-primary)" }}
          />
          <input
            className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--foreground)",
            }}
            placeholder={t("browse.search_ph")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--theme-primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.2)`;
            }}
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowSortMenu((p) => !p)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: showSortMenu
                ? "var(--theme-primary)"
                : `rgb(var(--theme-glow) / 0.2)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              color: "var(--theme-badge-text)",
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {sortLabels[sortBy]}
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform duration-200"
              style={{
                transform: showSortMenu ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showSortMenu && (
            <div
              className="absolute right-0 z-50 mt-1 w-52 rounded-xl border shadow-xl overflow-hidden"
              style={{
                backgroundColor: "var(--background)",
                borderColor: `rgb(var(--theme-glow) / 0.2)`,
              }}
            >
              {/* Sort by */}
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">
                  {t("browse.sort")}
                </p>
                {(["stars", "newest", "add_count"] as SortBy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSortBy(s);
                      setPage(1);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between"
                    style={{
                      backgroundColor:
                        sortBy === s
                          ? `rgb(var(--theme-glow) / 0.08)`
                          : "transparent",
                      color:
                        sortBy === s
                          ? "var(--theme-badge-text)"
                          : "var(--muted-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`;
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor =
                        sortBy === s
                          ? `rgb(var(--theme-glow) / 0.08)`
                          : "transparent";
                    }}
                  >
                    {sortLabels[s]}
                    {sortBy === s && (
                      <span style={{ color: "var(--theme-primary)" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div
                className="h-px mx-3"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
              />

              {/* Direction */}
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">
                  Direction
                </p>
                {(["desc", "asc"] as SortDir[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSortDir(d);
                      setPage(1);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between"
                    style={{
                      backgroundColor:
                        sortDir === d
                          ? `rgb(var(--theme-glow) / 0.08)`
                          : "transparent",
                      color:
                        sortDir === d
                          ? "var(--theme-badge-text)"
                          : "var(--muted-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`;
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor =
                        sortDir === d
                          ? `rgb(var(--theme-glow) / 0.08)`
                          : "transparent";
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

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground/50 mb-4">
          {total} deck{total !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Deck grid */}
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
              <div
                className="h-4 rounded-full w-2/3"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
              />
              <div
                className="h-3 rounded-full w-full"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}
              />
              <div
                className="h-3 rounded-full w-1/2"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}
              />
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-4xl">🔍</p>
          <div>
            <p className="font-semibold text-foreground mb-1">{t('browse.empty')}</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? `${t("browse.empty_search")} "${search}"`
                : t("browse.empty_sub")}
            </p>
          </div>
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
                  sessionStorage.setItem(
                    "retainly_added_decks",
                    JSON.stringify(next),
                  );
                  return next;
                });
              }}
              onToast={showGlobalToast}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-30 hover:brightness-110"
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
                className="px-2 text-muted-foreground text-sm"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className="w-9 h-9 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
                style={{
                  borderColor:
                    page === p
                      ? "var(--theme-primary)"
                      : `rgb(var(--theme-glow) / 0.2)`,
                  backgroundColor:
                    page === p
                      ? `rgb(var(--theme-glow) / 0.12)`
                      : `rgb(var(--theme-glow) / 0.04)`,
                  color:
                    page === p
                      ? "var(--theme-badge-text)"
                      : "var(--muted-foreground)",
                }}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-30 hover:brightness-110"
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
    </div>
  );
};

export default BrowsePage;
