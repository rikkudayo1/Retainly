"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Terminal, Search, Star, Zap, Plus, Check,
  ChevronDown, Globe, SlidersHorizontal, CircleQuestionMark
} from "lucide-react";
import {
  getPublishedQuizzes, getPublishedQuizzesCount,
  toggleQuizStar, addPublishedQuizToMySessions,
  PublishedQuiz,
} from "@/lib/db";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LIMIT = 8;
const SORT_OPTIONS = [
  { value: "newest", label: "newest" },
  { value: "stars", label: "most_starred" },
  { value: "popular", label: "most_added" },
] as const;
type SortValue = typeof SORT_OPTIONS[number]["value"];

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

// ── Quiz Card ──────────────────────────────────────────────────
const QuizCard = ({
  quiz,
  onAdded,
  onToast,
}: {
  quiz: PublishedQuiz;
  onAdded: (id: string) => void;
  onToast: (msg: string, error?: boolean) => void;
}) => {
  const [starred, setStarred] = useState(quiz.is_starred);
  const [starCount, setStarCount] = useState(quiz.star_count);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const isOwn = quiz.is_own;

  const handleStar = async () => {
    if (isOwn) return;
    const result = await toggleQuizStar(quiz.id, starred);
    setStarCount((p) => (result !== starred ? (result ? p + 1 : p - 1) : p));
    setStarred(result);
  };

  const handleAdd = async () => {
    if (adding || added || isOwn) return;
    setAdding(true);
    const { error } = await addPublishedQuizToMySessions(quiz.id);
    setAdding(false);
    if (error) { onToast("Failed to add quiz. Try again.", true); return; }
    setAdded(true);
    onAdded(quiz.id);
    onToast(`"${quiz.title}" added to your quizzes!`);
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
      className="relative rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
      style={{
        border: `1px solid ${isOwn ? "rgb(var(--theme-glow) / 0.25)" : added ? "rgb(34 197 94 / 0.25)" : "rgb(var(--theme-glow) / 0.15)"}`,
        backgroundColor: isOwn ? "rgb(var(--theme-glow) / 0.04)" : "rgb(var(--theme-glow) / 0.02)",
        opacity: isOwn ? 0.6 : added ? 0.75 : 1,
      }}
    >
      {/* Titlebar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: isOwn ? "var(--theme-primary)" : added ? "#22c55e" : "var(--theme-primary)", opacity: 0.7 }} />
        <span className="font-mono text-[9px] truncate flex-1"
          style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
          {quiz.title.toLowerCase().replace(/\s+/g, "_")}.quiz
        </span>
        <button
          onClick={handleStar}
          disabled={isOwn}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all shrink-0"
          style={{
            backgroundColor: starred ? "rgb(234 179 8 / 0.1)" : `rgb(var(--theme-glow) / 0.06)`,
            color: starred ? "#eab308" : `rgb(var(--theme-glow) / 0.4)`,
            border: `1px solid ${starred ? "rgb(234 179 8 / 0.3)" : `rgb(var(--theme-glow) / 0.12)`}`,
            cursor: isOwn ? "default" : "pointer",
          }}
        >
          <Star className="w-3 h-3" fill={starred ? "#eab308" : "none"} strokeWidth={starred ? 0 : 1.5} />
          {starCount}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="space-y-1">
          <h3 className="font-black text-base leading-tight text-foreground">{quiz.title}</h3>
          {quiz.description && (
            <p className="font-mono text-[10px] line-clamp-2 leading-relaxed"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
              // {quiz.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]"
          style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
          <span className="flex items-center gap-1"><CircleQuestionMark className="w-3 h-3" />{quiz.question_count} questions</span>
          <span className="flex items-center gap-1"><Plus className="w-3 h-3" />{quiz.add_count}</span>
          <span>{timeAgo(quiz.created_at)}</span>
        </div>

        <Link
          href={quiz.username ? `/profile/${quiz.username}` : "#"}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 w-fit transition-opacity hover:opacity-70"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-black shrink-0"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-primary)" }}>
            {quiz.avatar_url
              ? <img src={quiz.avatar_url} alt={quiz.username ?? ""} className="w-full h-full object-cover" />
              : quiz.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
            {isOwn ? "you" : `@${quiz.username ?? "anonymous"}`}
          </span>
        </Link>

        <div className="flex-1" />

        {isOwn ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[3px] text-xs font-bold font-mono"
            style={{ backgroundColor: "rgb(var(--theme-glow) / 0.04)", color: `rgb(var(--theme-glow) / 0.35)`, border: `1px solid rgb(var(--theme-glow) / 0.1)` }}>
            // your publication
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding || added}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[3px] text-xs font-bold font-mono transition-all hover:brightness-110 disabled:opacity-60 mt-1"
            style={added
              ? { backgroundColor: "rgb(34 197 94 / 0.08)", color: "#22c55e", border: "1px solid rgb(34 197 94 / 0.25)" }
              : { background: "var(--theme-primary)", color: "#fff" }}
          >
            {added ? <><Check className="w-3.5 h-3.5" /> added</>
              : adding ? "$ adding..."
              : <><Plus className="w-3.5 h-3.5" /> add_to_quizzes</>}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────
const QuizBrowsePage = () => {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<PublishedQuiz[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(total / LIMIT);

  const showToast = (message: string, error?: boolean) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (s: string, sort: SortValue, pg: number) => {
    setLoading(true);
    const [data, count] = await Promise.all([
      getPublishedQuizzes(s, sort, pg, LIMIT),
      getPublishedQuizzesCount(s),
    ]);
    setQuizzes(data);
    setTotal(count);
    setLoading(false);
  };

  useEffect(() => { load(search, sortBy, page); }, [search, sortBy, page]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setSortOpen(false);
    };
    if (sortOpen) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [sortOpen]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

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

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy;

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
        .sort-item { transition: background-color 0.12s ease; }
        .sort-item:hover { background-color: rgb(var(--theme-glow) / 0.06) !important; }
        .page-btn { transition: border-color 0.12s ease, background-color 0.12s ease, filter 0.12s ease; }
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
            <AlertDescription className="text-xs font-mono text-center"
              style={{ color: toast.error ? "#ef4444" : "var(--theme-badge-text)" }}>
              <span style={{ color: toast.error ? "#ef4444" : "var(--theme-primary)" }}>
                {toast.error ? "!" : "✓"}
              </span>{" "}{toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24">

          {/* ── Header ── */}
          <div className="page-enter mb-10">
            <div className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Globe className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>community quizzes</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-5xl font-black tracking-tight leading-none mb-3">Community</h1>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                  Browse and add quizzes shared by the community.
                </p>
              </div>
              <button
                onClick={() => router.push("/quizzes")}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-mono transition-all hover:brightness-110 shrink-0"
                style={{ border: `1px solid rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)`, color: "var(--theme-badge-text)" }}
              >
                my_quizzes
              </button>
            </div>

            {/* Stats bar */}
            {!loading && (
              <div className="flex items-center gap-5 mt-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.025)` }}>
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>results</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>sort</span>
                  <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>{sortLabel}</span>
                </div>
                {search && (
                  <>
                    <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>query</span>
                      <span className="font-bold" style={{ color: "var(--theme-primary)" }}>"{search}"</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Search + Sort ── */}
          <div className="page-enter stagger-1 mb-8" style={{ isolation: "isolate", position: "relative", zIndex: 50 }}>
            <SectionRule label="// 01  SEARCH & FILTER" />
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Search with terminal chrome */}
              <div className="flex-1 rounded-xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}>
                <div className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px]"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.4)` }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                  <span className="ml-2">search.sh</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                  <input
                    className="w-full pl-10 pr-4 py-3 text-sm font-mono outline-none"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.02)`, color: "var(--foreground)", caretColor: "var(--theme-primary)" }}
                    placeholder="search_quizzes..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    onFocus={(e) => {
                      const w = e.currentTarget.closest(".rounded-xl") as HTMLElement;
                      if (w) w.style.borderColor = "var(--theme-primary)";
                    }}
                    onBlur={(e) => {
                      const w = e.currentTarget.closest(".rounded-xl") as HTMLElement;
                      if (w) w.style.borderColor = `rgb(var(--theme-glow) / 0.2)`;
                    }}
                  />
                </div>
              </div>

              {/* Sort dropdown */}
              <div ref={sortMenuRef} className="relative shrink-0" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setSortOpen((p) => !p)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all font-mono w-full sm:w-auto"
                  style={{
                    borderColor: sortOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: sortOpen ? `rgb(var(--theme-glow) / 0.06)` : `rgb(var(--theme-glow) / 0.04)`,
                    color: "var(--theme-badge-text)",
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
                  <span className="text-xs">{sortLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{ color: `rgb(var(--theme-glow) / 0.5)`, transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 z-[200] mt-1 w-48 rounded-xl border shadow-xl overflow-hidden"
                    style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.2)` }}>
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px]"
                      style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.4)` }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                      <span className="ml-2">sort.sh</span>
                    </div>
                    <div className="px-3 py-2">
                      <p className="font-mono text-[10px] tracking-widest mb-1"
                        style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// sort_by</p>
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          onClick={() => { setSortBy(opt.value); setPage(1); setSortOpen(false); }}
                          className="sort-item w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between"
                          style={{
                            backgroundColor: sortBy === opt.value ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                            color: sortBy === opt.value ? "var(--theme-badge-text)" : "var(--muted-foreground)",
                          }}
                        >
                          {opt.label}
                          {sortBy === opt.value && <span style={{ color: "var(--theme-primary)" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Grid ── */}
          <div className="page-enter stagger-2">
            <SectionRule label={
              loading ? "// LOADING..."
                : quizzes.length === 0 ? "// NO RESULTS"
                : `// ${total} QUIZ${total !== 1 ? "ZES" : ""} FOUND`
            } />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <div key={i} className="rounded-2xl border animate-pulse"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                    <div className="h-9 border-b" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }} />
                    <div className="p-4 space-y-3">
                      <div className="h-4 rounded-full w-3/4" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                      <div className="h-3 rounded-full w-full" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.05)` }} />
                      <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)` }} />
                      <div className="h-9 rounded-xl mt-4" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-16 font-mono">
                <div className="text-xs mb-4" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <Globe className="w-8 h-8 mx-auto mb-4 opacity-20" />
                  <span style={{ color: "var(--theme-primary)" }}>$</span> search --query="{search || "*"}"
                  <br />
                  <span className="mt-2 block">// {search ? "no results found" : "no quizzes published yet"}</span>
                </div>
                {!search && <p className="text-sm text-muted-foreground">Be the first to publish a quiz!</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onAdded={(id) => setAddedIds((prev) => new Set([...prev, id]))}
                    onToast={showToast}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && !loading && (
            <div className="page-enter stagger-3 flex items-center justify-center gap-1.5 mt-10">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                ‹
              </button>
              {getPaginationPages().map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-2 font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>···</span>
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
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="page-btn px-3 py-2 rounded-xl font-mono text-sm border"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                ›
              </button>
            </div>
          )}

          {/* Footer */}
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

export default QuizBrowsePage;