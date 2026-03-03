"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ChevronDown, Globe, Terminal,
  Zap, Check, Star, Plus, Play,
} from "lucide-react";
import {
  getPublishedQuizzes, getPublishedQuizzesCount,
  toggleQuizStar, addQuizToCollection, Quiz,
} from "@/lib/db";

const LIMIT = 8;
type SortValue = "newest" | "stars" | "popular";
type SortDir = "asc" | "desc";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>{label}</span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

const PublicQuizCard = ({
  quiz,
  onToast,
}: {
  quiz: Quiz;
  onToast: (message: string, error?: boolean) => void;
}) => {
  const router = useRouter();
  const [starred, setStarred] = useState(quiz.is_starred ?? false);
  const [starCount, setStarCount] = useState(quiz.star_count);
  // Local state so the button updates immediately after adding
  const [isAdded, setIsAdded] = useState(quiz.is_added ?? false);
  const [adding, setAdding] = useState(false);

  const handleStar = async () => {
    const result = await toggleQuizStar(quiz.id, starred);
    if (result !== starred) {
      setStarCount((p) => (result ? p + 1 : p - 1));
      setStarred(result);
    }
  };

  const handleAdd = async () => {
    if (isAdded || adding) return;
    setAdding(true);
    const { error } = await addQuizToCollection(quiz.id);
    setAdding(false);
    if (error) {
      onToast("Failed to add quiz. Try again.", true);
      return;
    }
    setIsAdded(true);
    onToast(`"${quiz.title}" added to your collection!`);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d_ago`;
    const months = Math.floor(days / 30);
    return months < 12 ? `${months}mo_ago` : `${Math.floor(months / 12)}y_ago`;
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col transition-all"
      style={{
        borderColor: `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}
    >
      {/* Titlebar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.08)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--theme-primary)", opacity: 0.7 }} />
        <span className="font-mono text-[9px] truncate flex-1"
          style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
          {quiz.title.toLowerCase().replace(/\s+/g, "_")}.quiz
        </span>
        {/* Star button */}
        <button
          onClick={handleStar}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all hover:brightness-110"
          style={{
            backgroundColor: starred ? "rgb(234 179 8 / 0.1)" : `rgb(var(--theme-glow) / 0.06)`,
            color: starred ? "#eab308" : `rgb(var(--theme-glow) / 0.4)`,
            border: `1px solid ${starred ? "rgb(234 179 8 / 0.3)" : `rgb(var(--theme-glow) / 0.12)`}`,
          }}
        >
          <Star className="w-3 h-3" fill={starred ? "#eab308" : "none"} strokeWidth={starred ? 0 : 1.5} />
          {starCount}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + description */}
        <div className="space-y-1">
          <h3 className="font-black text-base leading-tight">{quiz.title}</h3>
          {quiz.description && (
            <p
              className="font-mono text-[10px] line-clamp-2 leading-relaxed"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              // {quiz.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div
          className="flex items-center gap-3 font-mono text-[10px]"
          style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
        >
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" /> {quiz.question_count} q&apos;s
          </span>
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" /> {quiz.add_count}
          </span>
          <span>{timeAgo(quiz.created_at)}</span>
        </div>

        {/* Creator */}
        {quiz.username && (
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-black shrink-0"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                color: "var(--theme-primary)",
              }}
            >
              {quiz.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quiz.avatar_url} alt={quiz.username} className="w-full h-full object-cover" />
              ) : (quiz.username[0]?.toUpperCase() ?? "?")}
            </div>
            <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
              @{quiz.username}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2">
          {/* Study now — only visible if already added */}
          {isAdded && (
            <button
              onClick={() => router.push(`/quizzes/study/${quiz.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[3px] text-xs font-bold font-mono transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              <Play className="w-3.5 h-3.5" /> study
            </button>
          )}

          {/* Add / added button */}
          <button
            onClick={handleAdd}
            disabled={adding || isAdded}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[3px] text-xs font-bold font-mono transition-all hover:brightness-110 disabled:cursor-default"
            style={
              isAdded
                ? {
                    backgroundColor: "rgb(34 197 94 / 0.08)",
                    color: "#22c55e",
                    border: "1px solid rgb(34 197 94 / 0.25)",
                    opacity: 1,
                  }
                : { background: "var(--theme-primary)", color: "#fff" }
            }
          >
            {isAdded ? (
              <><Check className="w-3.5 h-3.5" /> in_collection</>
            ) : adding ? (
              <span className="font-mono text-[10px]">$ adding...</span>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> add_to_collection</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizBrowsePage = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  const showToast = (message: string, error?: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, error });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [data, count] = await Promise.all([
      getPublishedQuizzes(search, sortBy, sortDir, page, LIMIT),
      getPublishedQuizzesCount(search),
    ]);
    setQuizzes(data);
    setTotal(count);
    setLoading(false);
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

  // Clear toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const sortLabels: Record<SortValue, string> = {
    newest: "newest",
    stars: "most_starred",
    popular: "most_added",
  };
  const dirLabels: Record<SortDir, string> = { desc: "descending", asc: "ascending" };

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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1 { animation-delay: 60ms; }
        .stagger-2 { animation-delay: 120ms; }
        .stagger-3 { animation-delay: 180ms; }
        .toast-enter { animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
        .themed-input {
          background-color: rgb(var(--theme-glow) / 0.04);
          border-color: rgb(var(--theme-glow) / 0.2);
          transition: border-color 0.15s ease, background-color 0.15s ease;
          color: var(--foreground);
        }
        .themed-input:focus {
          border-color: var(--theme-primary);
          background-color: rgb(var(--theme-glow) / 0.06);
          outline: none;
        }
        .themed-input::placeholder { color: rgb(var(--theme-glow) / 0.3); }
        .sort-item { transition: background-color 0.12s ease; }
        .sort-item:hover { background-color: rgb(var(--theme-glow) / 0.06) !important; }
        .page-btn { transition: border-color 0.12s ease, background-color 0.12s ease, filter 0.12s ease; }
        .page-btn:hover:not(:disabled) { filter: brightness(1.15); }
        .page-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast-enter fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm px-4 pointer-events-none">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: toast.error
                ? "rgb(239 68 68 / 0.12)"
                : `rgb(var(--theme-glow) / 0.12)`,
              borderColor: toast.error
                ? "rgb(239 68 68 / 0.3)"
                : `rgb(var(--theme-glow) / 0.25)`,
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]"
              style={{
                backgroundColor: toast.error ? "rgb(239 68 68 / 0.15)" : "rgb(34 197 94 / 0.15)",
                color: toast.error ? "#ef4444" : "#22c55e",
              }}
            >
              {toast.error ? "✗" : "✓"}
            </span>
            <p className="font-mono text-[11px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24">

          {/* Header */}
          <div className="page-enter mb-10">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Globe className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>public quizzes</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">Public Quizzes</h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Discover and add community-created quizzes to your collection.
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
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>results</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>page</span>
                  <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>
                    {page}/{totalPages || 1}
                  </span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>sort</span>
                  <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>
                    {sortLabels[sortBy]} · {dirLabels[sortDir].slice(0, 3)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search + filter */}
          <div
            className="page-enter stagger-1 mb-8"
            style={{ isolation: "isolate", position: "relative", zIndex: 50 }}
          >
            <SectionRule label="// 01  SEARCH & FILTER" />
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
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
                <div className="relative flex">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                  />
                  <input
                    className="flex-1 pl-10 pr-3 py-3 text-sm font-mono outline-none themed-input"
                    placeholder="search quizzes..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 text-xs font-mono font-bold border-l transition-all hover:brightness-110"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.15)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                      color: "var(--theme-badge-text)",
                    }}
                  >
                    $ run
                  </button>
                </div>
              </div>

              {/* Sort menu */}
              <div ref={sortMenuRef} className="relative shrink-0" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowSortMenu((p) => !p)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all font-mono h-full"
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
                    style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.2)` }}
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
                      <span className="ml-2">sort.sh</span>
                    </div>

                    <div className="px-3 py-2">
                      <p className="font-mono text-[10px] tracking-widest mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// sort_by</p>
                      {(["newest", "stars", "popular"] as SortValue[]).map((s) => (
                        <button key={s} onClick={() => { setSortBy(s); setPage(1); }}
                          className="sort-item w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between"
                          style={{
                            backgroundColor: sortBy === s ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                            color: sortBy === s ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                          }}>
                          {sortLabels[s]}
                          {sortBy === s && <span style={{ color: "var(--theme-primary)" }}>✓</span>}
                        </button>
                      ))}
                    </div>

                    <div className="h-px mx-3 my-1" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />

                    <div className="px-3 py-2">
                      <p className="font-mono text-[10px] tracking-widest mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// direction</p>
                      {(["desc", "asc"] as SortDir[]).map((d) => (
                        <button key={d} onClick={() => { setSortDir(d); setPage(1); setShowSortMenu(false); }}
                          className="sort-item w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between"
                          style={{
                            backgroundColor: sortDir === d ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                            color: sortDir === d ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                          }}>
                          {dirLabels[d]}
                          {sortDir === d && <span style={{ color: "var(--theme-primary)" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="page-enter stagger-2">
            <SectionRule
              label={
                loading
                  ? "// LOADING..."
                  : quizzes.length === 0
                  ? "// NO RESULTS"
                  : `// ${total} QUIZ${total !== 1 ? "ZES" : ""} FOUND`
              }
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border animate-pulse h-52"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.1)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                    }}
                  />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-16 font-mono">
                <div className="text-xs mb-4" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <span style={{ color: "var(--theme-primary)" }}>$</span>{" "}
                  search --query=&quot;{search || "*"}&quot;
                  <br />
                  <span className="mt-2 block">
                    // {search ? "no results found" : "no quizzes published yet"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try a different search term." : "Be the first to publish a quiz!"}
                </p>
                {search && (
                  <button
                    onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                    style={{
                      border: `1px solid rgb(var(--theme-glow) / 0.2)`,
                      color: "var(--muted-foreground)",
                      backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    }}
                  >
                    ✕ clear_search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <PublicQuizCard key={quiz.id} quiz={quiz} onToast={showToast} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="page-enter stagger-3 flex items-center justify-center gap-1.5 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >‹</button>
              {getPaginationPages().map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-2 font-mono text-xs"
                    style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>···</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className="page-btn w-9 h-9 rounded-xl font-mono text-xs font-bold border"
                    style={{
                      borderColor: page === p ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                      backgroundColor: page === p ? `rgb(var(--theme-glow) / 0.12)` : `rgb(var(--theme-glow) / 0.04)`,
                      color: page === p ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                    }}>
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >›</button>
            </div>
          )}

          <div className="mt-16 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            <span className="font-mono text-[10px] tracking-[0.25em]"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>RETAINLY</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizBrowsePage;