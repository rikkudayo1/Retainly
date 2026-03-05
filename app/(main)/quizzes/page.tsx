"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Zap,
  Trash2,
  Play,
  Globe,
  Pencil,
  Star,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { getMyQuizCollection, deleteQuizAttempt, deleteQuiz, Quiz } from "@/lib/db";
import { createClient } from "@/lib/supabase";

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

const QuizCard = ({
  quiz,
  currentUserId,
  onRemove,
  expanded,
  onToggleExpand,
}: {
  quiz: Quiz;
  currentUserId: string | null;
  onRemove: (quizId: string, isOwner: boolean) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();

  const isOwner = !!currentUserId && currentUserId === quiz.creator_id;

  const scorePercent =
    quiz.user_score != null && quiz.question_count > 0
      ? Math.round((quiz.user_score / quiz.question_count) * 100)
      : null;

  const handleRemove = async () => {
    if (!confirming) { setConfirming(true); return; }
    setRemoving(true);
    await onRemove(quiz.id, isOwner);
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

  const scoreColor =
    scorePercent === null ? `rgb(var(--theme-glow) / 0.3)`
    : scorePercent >= 80  ? "#22c55e"
    : scorePercent >= 50  ? "#f59e0b"
    : "#ef4444";

  const scoreLabel =
    scorePercent === null   ? null
    : scorePercent === 100  ? "perfect"
    : scorePercent >= 80    ? "great"
    : scorePercent >= 50    ? "okay"
    : "retry";

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-200"
      style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
    >
      {/* Titlebar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--theme-primary)", opacity: 0.7 }} />
        <span className="font-mono text-[9px] truncate flex-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
          {quiz.title.toLowerCase().replace(/\s+/g, "_")}.quiz
        </span>
        <div className="flex items-center gap-2">
          {quiz.is_published && (
            <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: "#22c55e" }}>
              <Globe className="w-2.5 h-2.5" /> public
            </span>
          )}
          {isOwner && (
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-primary)", border: `1px solid rgb(var(--theme-glow) / 0.12)` }}
            >
              yours
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + meta */}
        <div>
          <p className="font-black text-base leading-tight">{quiz.title}</p>
          {quiz.username && (
            <Link
              href={`/profile/${quiz.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 mt-1.5 w-fit transition-opacity hover:opacity-70 mb-3"
            >
              <div
                className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center text-[8px] font-black shrink-0"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-primary)" }}
              >
                {quiz.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={quiz.avatar_url} alt={quiz.username} className="w-full h-full object-cover" />
                ) : (
                  quiz.username[0]?.toUpperCase()
                )}
              </div>
              <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                @{quiz.username}
              </span>
            </Link>
          )}
          <div className="flex items-center gap-3 font-mono text-[10px] mt-2" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {quiz.question_count} questions</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeAgo(quiz.created_at)}</span>
            {quiz.star_count > 0 && (
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {quiz.star_count}</span>
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <span>// best_score</span>
            <span className="flex items-center gap-1.5">
              {scoreLabel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${scoreColor}18`, color: scoreColor }}>
                  {scoreLabel}
                </span>
              )}
              <span style={{ color: scoreColor, fontWeight: "bold" }}>
                {scorePercent !== null ? `${scorePercent}%` : "—"}
              </span>
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${scorePercent ?? 0}%`, backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Expand toggle */}
        {(quiz.description || (quiz.questions?.length ?? 0) > 0) && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 font-mono text-[10px] transition-all w-fit"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--theme-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = `rgb(var(--theme-glow) / 0.4)`)}
          >
            <ChevronDown
              className="w-3 h-3 transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {expanded ? "// collapse" : "// show_details"}
          </button>
        )}

        {/* Expanded details */}
        {expanded && (
          <div
            className="rounded-xl border overflow-hidden text-xs font-mono"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
          >
            {quiz.description && (
              <div className="px-3 py-2.5 border-b" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
                <p className="text-[9px] mb-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// description</p>
                <p className="leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "inherit", fontSize: "11px" }}>
                  {quiz.description}
                </p>
              </div>
            )}

            <div className="flex">
              <div className="flex-1 px-3 py-2 flex flex-col gap-0.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// questions</span>
                <span className="font-bold text-foreground">{quiz.question_count}</span>
              </div>
              <div className="flex-1 px-3 py-2 flex flex-col gap-0.5" style={{ borderLeft: `1px solid rgb(var(--theme-glow) / 0.08)` }}>
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// best_score</span>
                <span className="font-bold" style={{ color: scoreColor }}>
                  {scorePercent !== null ? `${scorePercent}%` : "not_played"}
                </span>
              </div>
              <div className="flex-1 px-3 py-2 flex flex-col gap-0.5" style={{ borderLeft: `1px solid rgb(var(--theme-glow) / 0.08)` }}>
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// stars</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: "#f59e0b" }} />
                  {quiz.star_count}
                </span>
              </div>
            </div>

            {(quiz.questions?.length ?? 0) > 0 && (
              <div className="px-3 py-2.5 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
                <p className="text-[9px] mb-2" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// sample_questions</p>
                <div className="space-y-1.5">
                  {quiz.questions.slice(0, 3).map((q: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] mt-0.5"
                        style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-primary)" }}
                      >
                        {i + 1}
                      </span>
                      <p className="leading-relaxed line-clamp-2" style={{ color: `rgb(var(--theme-glow) / 0.6)`, fontSize: "11px", fontFamily: "inherit" }}>
                        {q.question}
                      </p>
                    </div>
                  ))}
                  {quiz.questions.length > 3 && (
                    <p className="text-[9px] pl-6" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                      +{quiz.questions.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
          <button
            onClick={() => router.push(`/quizzes/study/${quiz.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all hover:brightness-110"
            style={{ background: "var(--theme-primary)", color: "#fff" }}
          >
            <Play className="w-3.5 h-3.5" /> study
          </button>

          {isOwner && (
            <button
              onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
              className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
              style={{ border: `1px solid rgb(var(--theme-glow) / 0.15)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-primary)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-primary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"; }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
                style={{ border: `1px solid rgb(var(--theme-glow) / 0.15)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}
              >
                cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all disabled:opacity-40"
                style={{ backgroundColor: "rgb(239 68 68 / 0.1)", color: "#ef4444", border: "1px solid rgb(239 68 68 / 0.3)" }}
              >
                {removing ? "..." : isOwner ? "delete_for_all" : "confirm"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
              style={{ border: `1px solid rgb(var(--theme-glow) / 0.15)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(239 68 68 / 0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"; }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const QuizCollectionPage = () => {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: { user } }, data] = await Promise.all([
        supabase.auth.getUser(),
        getMyQuizCollection(),
      ]);
      setCurrentUserId(user?.id ?? null);
      setQuizzes(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleRemove = async (quizId: string, isOwner: boolean) => {
    if (isOwner) await deleteQuiz(quizId);
    else await deleteQuizAttempt(quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    setExpandedId((prev) => (prev === quizId ? null : prev));
  };

  const handleToggleExpand = (quizId: string) => {
    if (!quizId) return;
    setExpandedId((prev) => (prev === quizId ? null : quizId));
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1 { animation-delay: 60ms; }
      `}</style>

      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.022,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "128px 128px",
        }}
      />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24">

          <div className="page-enter mb-10">
            <div className="flex items-center gap-2 font-mono text-[11px] mb-7" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>my collection</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">My Quizzes</h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Your personal quiz collection and study sessions.
            </p>

            {!loading && (
              <div
                className="flex items-center gap-5 mt-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.025)` }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>total</span>
                  <span className="font-bold text-foreground">{quizzes.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>yours</span>
                  <span className="font-bold text-foreground">
                    {quizzes.filter((q) => q.creator_id === currentUserId).length}
                  </span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>studied</span>
                  <span className="font-bold text-foreground">
                    {quizzes.filter((q) => q.user_score != null && q.user_score > 0).length}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="page-enter stagger-1">
            <SectionRule
              label={loading ? "// LOADING..." : `// ${quizzes.length} QUIZ${quizzes.length !== 1 ? "ZES" : ""} IN COLLECTION`}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border animate-pulse h-48"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
                  />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-16 font-mono">
                <div className="text-xs mb-4" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la
                  <br />
                  <span className="mt-2 block">// no quizzes yet</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create your first quiz or browse community quizzes.
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => router.push("/quizzes/generate")}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                    style={{ background: "var(--theme-primary)", color: "#fff" }}
                  >
                    + create_quiz
                  </button>
                  <button
                    onClick={() => router.push("/quizzes/browse")}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                    style={{ border: `1px solid rgb(var(--theme-glow) / 0.2)`, color: "var(--muted-foreground)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}
                  >
                    <Globe className="w-3.5 h-3.5 inline mr-1" /> browse
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {quizzes.map((quiz, idx) => (
                  <QuizCard
                    key={quiz.id ?? `fallback-${idx}`}
                    quiz={quiz}
                    currentUserId={currentUserId}
                    onRemove={handleRemove}
                    expanded={!!quiz.id && expandedId === quiz.id}
                    onToggleExpand={() => handleToggleExpand(quiz.id)}
                  />
                ))}
              </div>
            )}
          </div>

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

export default QuizCollectionPage;