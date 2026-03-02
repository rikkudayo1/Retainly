"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Terminal, Plus, Trash2, ArrowRight, Pencil,
  Trophy, Zap, Calendar, Globe,
} from "lucide-react";
import {
  getQuizSessions, deleteQuizSession, unpublishQuiz, DBQuizSession,
} from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

const QuizzesPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<DBQuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getQuizSessions().then((data) => { setQuizzes(data); setLoading(false); });
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteQuizSession(id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setDeletingId(null);
  };

  const handleUnpublish = async (quiz: DBQuizSession) => {
    if (!quiz.source_published_quiz_id) return;
    await unpublishQuiz(quiz.source_published_quiz_id);
    setQuizzes((prev) => prev.map((q) =>
      q.id === quiz.id ? { ...q, source_published_quiz_id: null } : q
    ));
  };

  const scoreColor = (score: number, total: number) => {
    const pct = total === 0 ? 0 : (score / total) * 100;
    if (pct >= 80) return "#22c55e";
    if (pct >= 50) return "#facc15";
    return "#ef4444";
  };

  const totalQuestions = quizzes.reduce((a, q) => a + (q.questions?.length ?? 0), 0);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes deleteOut {
          to { opacity: 0; transform: translateX(12px); max-height: 0; padding: 0; margin: 0; overflow: hidden; }
        }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        .stagger-1  { animation-delay: 60ms; }
        .row-enter  { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        .row-delete { animation: deleteOut 0.25s ease forwards; }
        .quiz-card  { transition: border-color 0.15s ease, background-color 0.15s ease; }
        .quiz-card:hover {
          border-color: rgb(var(--theme-glow) / 0.35) !important;
          background-color: rgb(var(--theme-glow) / 0.06) !important;
        }
        .new-btn {
          background: var(--theme-primary);
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: filter 0.15s ease;
        }
        .new-btn:hover { filter: brightness(1.1); }
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

          {/* ── Header ── */}
          <div className="page-enter mb-12">
            <div className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-5xl font-black tracking-tight leading-none mb-5">My Quizzes</h1>
                <button
                  onClick={() => router.push("/quizzes/generate")}
                  className="new-btn hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-sm font-mono shrink-0"
                >
                  <Plus className="w-4 h-4" /> New Quiz
                </button>
              </div>

              {!loading && quizzes.length > 0 && (
                <div className="flex items-center gap-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.025)` }}>
                  <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>quizzes</span>
                    <span className="font-bold text-foreground">{quizzes.length}</span>
                  </div>
                  <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>questions</span>
                    <span className="font-bold text-foreground">{totalQuestions}</span>
                  </div>
                  <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-bold">ready</span>
                  </span>
                </div>
              )}

              <button
                onClick={() => router.push("/quizzes/generate")}
                className="new-btn sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> New Quiz
              </button>
            </div>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border p-5 animate-pulse"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full w-1/3" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                      <div className="h-2.5 rounded-full w-1/4" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.05)` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && quizzes.length === 0 && (
            <div className="page-enter stagger-1 text-center py-16">
              <div className="font-mono text-xs mb-6" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la quizzes/
                <br />
                <span className="mt-2 block">// no quizzes found</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Generate a quiz to get started.</p>
              <button
                onClick={() => router.push("/quizzes/generate")}
                className="new-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-[3px] text-sm font-mono"
              >
                <Plus className="w-4 h-4" /> Generate Quiz
              </button>
            </div>
          )}

          {/* ── List ── */}
          {!loading && quizzes.length > 0 && (
            <div className="page-enter stagger-1">
              <SectionRule label={`// ${quizzes.length} QUIZ${quizzes.length !== 1 ? "ZES" : ""}`} />

              <div className="space-y-3">
                {quizzes.map((quiz, i) => {
                  const isDeleting = deletingId === quiz.id;
                  const pct = quiz.total === 0 ? 0 : Math.round((quiz.score / quiz.total) * 100);
                  const isPublished = !!quiz.source_published_quiz_id;
                  const isCommunity = !!quiz.source_published_quiz_id && !!quiz.source_creator_username;

                  return (
                    <div
                      key={quiz.id}
                      className={`quiz-card group relative rounded-2xl border p-5 row-enter ${isDeleting ? "row-delete" : ""}`}
                      style={{
                        animationDelay: `${i * 40}ms`,
                        borderColor: `rgb(var(--theme-glow) / 0.15)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Index badge */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 font-mono"
                          style={{ background: `rgb(var(--theme-glow) / 0.1)`, color: "var(--theme-badge-text)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title + delete */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-bold text-base truncate text-foreground">{quiz.title}</p>

                              {/* Community creator badge */}
                              {isCommunity && (
                                <Link
                                  href={`/profile/${quiz.source_creator_username}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] px-2 py-0.5 rounded-full border w-fit transition-all hover:brightness-110 font-mono"
                                  style={{
                                    borderColor: `rgb(var(--theme-glow) / 0.2)`,
                                    color: "var(--theme-badge-text)",
                                    backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                                  }}
                                >
                                  <div
                                    className="w-3.5 h-3.5 rounded-full overflow-hidden flex items-center justify-center text-[8px] font-black shrink-0"
                                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--theme-primary)" }}
                                  >
                                    {quiz.source_creator_avatar ? (
                                      <img
                                        src={quiz.source_creator_avatar}
                                        alt={quiz.source_creator_username!}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      quiz.source_creator_username![0].toUpperCase()
                                    )}
                                  </div>
                                  {quiz.source_creator_username}
                                </Link>
                              )}
                            </div>

                            <button
                              onClick={() => handleDelete(quiz.id)}
                              className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 shrink-0"
                              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(239 68 68)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = `rgb(var(--theme-glow) / 0.4)`)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-4 font-mono text-[10px] mb-3"
                            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {quiz.questions?.length ?? 0} questions
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" style={{ color: scoreColor(quiz.score, quiz.total) }} />
                              <span style={{ color: scoreColor(quiz.score, quiz.total) }}>{pct}%</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(quiz.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                            </span>
                          </div>

                          {/* Score bar */}
                          <div className="h-1 rounded-full overflow-hidden mb-3"
                            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: scoreColor(quiz.score, quiz.total) }} />
                          </div>

                          {/* Bottom actions */}
                          <div className="flex items-center gap-2 pt-3 border-t"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
                            {!isCommunity && (
                              <button
                                onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold font-mono transition-all"
                                style={{ border: `1px solid rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--theme-badge-text)" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.12)`; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`; }}
                              >
                                <Pencil className="w-3 h-3" /> edit
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/quizzes/study?id=${quiz.id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-mono transition-all"
                              style={{ background: "var(--theme-primary)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
                            >
                              Retake <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* New quiz dashed btn */}
              <button
                onClick={() => router.push("/quizzes/generate")}
                className="w-full mt-4 py-3 rounded-xl border border-dashed font-mono text-xs transition-all duration-150"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, color: `rgb(var(--theme-glow) / 0.4)` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.35)`;
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-badge-text)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.04)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                  (e.currentTarget as HTMLButtonElement).style.color = `rgb(var(--theme-glow) / 0.4)`;
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                + New Quiz
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

export default QuizzesPage;