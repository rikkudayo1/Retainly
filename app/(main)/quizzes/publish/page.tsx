"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, FileText, Upload, EyeOff, Trash2, Zap, Star } from "lucide-react";
import {
  getMyQuizzes,
  publishQuiz,
  unpublishQuiz,
  deleteQuiz,
  updateQuiz,
  Quiz,
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

// ── Published quiz card ────────────────────────────────────────
const PublishedQuizCard = ({
  quiz,
  onUnpublish,
  onDelete,
}: {
  quiz: Quiz;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();

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
    <div className="rounded-2xl border overflow-hidden flex flex-col"
      style={{
        borderColor: `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}>
      <div className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.08)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
        }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--theme-primary)", opacity: 0.7 }} />
        <span className="font-mono text-[9px] truncate flex-1"
          style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
          {quiz.title.toLowerCase().replace(/\s+/g, "_")}.quiz
        </span>
        <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#eab308" }}>
          <Star className="w-2.5 h-2.5 fill-current" /> {quiz.star_count}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="font-black text-base leading-tight">{quiz.title}</p>
          {quiz.description && (
            <p className="font-mono text-[10px] mt-1 line-clamp-2"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
              // {quiz.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]"
          style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" /> {quiz.question_count} q&apos;s
          </span>
          <span className="flex items-center gap-1">
            <Upload className="w-3 h-3" /> {quiz.add_count} added
          </span>
          <span>{timeAgo(quiz.created_at)}</span>
        </div>

        <div className="flex-1" />

        {/* Edit + Unpublish */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
          <button onClick={() => router.push(`/quizzes/edit/${quiz.id}`)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold font-mono transition-all hover:brightness-110"
            style={{
              border: `1px solid rgb(var(--theme-glow) / 0.2)`,
              color: "var(--muted-foreground)",
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
            }}>
            edit
          </button>

          {confirmingUnpublish ? (
            <>
              <button onClick={() => setConfirmingUnpublish(false)}
                className="flex-1 py-2 rounded-xl text-xs font-mono transition-all"
                style={{
                  border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}>
                cancel
              </button>
              <button onClick={() => { setConfirmingUnpublish(false); onUnpublish(quiz.id); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                style={{
                  backgroundColor: "rgb(239 68 68 / 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgb(239 68 68 / 0.3)",
                }}>
                confirm
              </button>
            </>
          ) : (
            <button onClick={() => { setConfirmingDelete(false); setConfirmingUnpublish(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all hover:brightness-110"
              style={{
                border: `1px solid rgb(var(--theme-glow) / 0.2)`,
                color: "var(--muted-foreground)",
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}>
              <EyeOff className="w-3.5 h-3.5" /> unpublish
            </button>
          )}
        </div>

        {/* Delete */}
        <div className="flex gap-2">
          {confirmingDelete ? (
            <>
              <button onClick={() => setConfirmingDelete(false)}
                className="flex-1 py-2 rounded-xl text-xs font-mono transition-all"
                style={{
                  border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}>
                cancel
              </button>
              <button onClick={() => { setConfirmingDelete(false); onDelete(quiz.id); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                style={{
                  backgroundColor: "rgb(239 68 68 / 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgb(239 68 68 / 0.3)",
                }}>
                confirm delete
              </button>
            </>
          ) : (
            <button onClick={() => { setConfirmingUnpublish(false); setConfirmingDelete(true); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all"
              style={{
                border: `1px solid rgb(239 68 68 / 0.2)`,
                color: "#ef4444",
                backgroundColor: "rgb(239 68 68 / 0.04)",
              }}>
              <Trash2 className="w-3.5 h-3.5" /> delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────
const QuizPublishPage = () => {
  const { t } = useLanguage();

  const [draftQuizzes, setDraftQuizzes] = useState<Quiz[]>([]);
  const [publishedQuizzes, setPublishedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Close dropdown on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  // Initial load
  useEffect(() => {
    getMyQuizzes().then((all) => {
      setDraftQuizzes(all.filter((q) => !q.is_published));
      setPublishedQuizzes(all.filter((q) => q.is_published));
      setLoading(false);
    });
  }, []);

  const refreshLists = async () => {
    const all = await getMyQuizzes();
    setDraftQuizzes(all.filter((q) => !q.is_published));
    setPublishedQuizzes(all.filter((q) => q.is_published));
  };

  // Selecting a quiz pre-fills the title
  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setTitle(quiz.title);
    setDropdownOpen(false);
    setError("");
  };

  const handlePublish = async () => {
    if (!selectedQuiz) { setError("Please select a quiz."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }

    setError("");
    setPublishing(true);

    // Update title on the quiz if the user changed it
    if (title.trim() !== selectedQuiz.title) {
      await updateQuiz(selectedQuiz.id, { title: title.trim() });
    }

    const { error: pubError } = await publishQuiz(selectedQuiz.id, description.trim());
    setPublishing(false);

    if (pubError) { setError(pubError); return; }

    await refreshLists();
    setSelectedQuiz(null);
    setTitle("");
    setDescription("");
    setSuccess("Quiz published successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleUnpublish = async (id: string) => {
    await unpublishQuiz(id);
    await refreshLists();
  };

  const handleDelete = async (id: string) => {
    await deleteQuiz(id);
    setPublishedQuizzes((prev) => prev.filter((q) => q.id !== id));
    setDraftQuizzes((prev) => prev.filter((q) => q.id !== id));
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
        .dropdown-item { transition: background-color 0.12s ease, color 0.12s ease; }
        .dropdown-item:hover { background-color: rgb(var(--theme-glow) / 0.08); color: var(--theme-badge-text); }
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

          {/* ── Header ── */}
          <div className="page-enter mb-12">
            <div className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Globe className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes/publish</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>share with community</span>
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-none mb-3">Publish Quiz</h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Share your quiz with the community so others can study it too.
            </p>

            {!loading && (
              <div className="flex items-center gap-5 mt-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.12)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
                }}>
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>published</span>
                  <span className="font-bold text-foreground">{publishedQuizzes.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>drafts</span>
                  <span className="font-bold text-foreground">{draftQuizzes.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">online</span>
                </span>
              </div>
            )}
          </div>

          {/* ── Publish form ── */}
          <div className="page-enter stagger-1 mb-10" style={{ position: "relative", zIndex: 10 }}>
            <SectionRule label="// 01  NEW PUBLICATION" />

            <div className="rounded-2xl border overflow-visible"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.18)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
              }}>
              {/* Terminal chrome */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b font-mono text-[10px] rounded-t-2xl"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  color: `rgb(var(--theme-glow) / 0.4)`,
                }}>
                <span className="w-2 h-2 rounded-full bg-red-400/40" />
                <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
                <span className="w-2 h-2 rounded-full bg-green-400/40" />
                <span className="ml-3">publish.sh</span>
              </div>

              <div className="p-6 space-y-6">

                {/* Quiz selector */}
                <div>
                  <label className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                    // SELECT QUIZ <span style={{ color: "#ef4444" }}>*</span>
                  </label>

                  <div ref={dropdownRef} className="relative" style={{ zIndex: 50 }}>
                    <button
                      onClick={() => setDropdownOpen((p) => !p)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
                      style={{
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        borderColor: dropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                        color: selectedQuiz ? "var(--foreground)" : "var(--muted-foreground)",
                      }}>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary)" }} />
                        {selectedQuiz ? selectedQuiz.title : "select a quiz to publish..."}
                      </div>
                      <ChevronDown className="w-4 h-4 transition-transform duration-200"
                        style={{
                          color: `rgb(var(--theme-glow) / 0.5)`,
                          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute w-full mt-1 rounded-xl border shadow-xl"
                        style={{
                          zIndex: 200,
                          backgroundColor: "var(--background)",
                          borderColor: `rgb(var(--theme-glow) / 0.2)`,
                          maxHeight: "13rem",
                          overflowY: "auto",
                        }}>
                        {/* Sticky chrome bar */}
                        <div className="flex items-center gap-1.5 px-3 py-2 border-b font-mono text-[10px] sticky top-0"
                          style={{
                            borderColor: `rgb(var(--theme-glow) / 0.1)`,
                            backgroundColor: "var(--background)",
                            color: `rgb(var(--theme-glow) / 0.4)`,
                          }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                          <span className="ml-2">quizzes.sh</span>
                        </div>

                        {draftQuizzes.length === 0 ? (
                          <p className="text-xs font-mono text-muted-foreground px-4 py-3">
                            <span style={{ color: "var(--theme-primary)" }}>$</span> ls — no unpublished quizzes found
                          </p>
                        ) : (
                          draftQuizzes.map((quiz) => (
                            <button key={quiz.id}
                              onClick={() => handleSelectQuiz(quiz)}
                              className="dropdown-item w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-muted-foreground">
                              <div className="flex items-center gap-2 font-mono text-xs min-w-0">
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                                <span className="truncate">{quiz.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-[10px]"
                                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                                  {quiz.question_count} q&apos;s
                                </span>
                                {selectedQuiz?.id === quiz.id && (
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

                {/* Title */}
                <div>
                  <label className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                    // TITLE <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="themed-input"
                    placeholder="e.g. Biology Chapter 4 — Cell Division..."
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(""); }}
                    maxLength={80}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                    // DESCRIPTION <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.2)` }}>
                    <div className="flex items-center justify-between px-3 py-2 border-b font-mono text-[10px]"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.1)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        color: `rgb(var(--theme-glow) / 0.4)`,
                      }}>
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
                      placeholder="What is this quiz about? Who is it for?"
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

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border font-mono text-xs"
                    style={{
                      borderColor: `rgb(239 68 68 / 0.3)`,
                      backgroundColor: `rgb(239 68 68 / 0.06)`,
                      color: "#ef4444",
                    }}>
                    <span>!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border font-mono text-xs"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.25)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                      color: "var(--theme-badge-text)",
                    }}>
                    <span style={{ color: "var(--theme-primary)" }}>✓</span>
                    <span>{success}</span>
                  </div>
                )}

                {/* Publish button */}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="publish-btn w-full py-3.5 rounded-[3px] font-mono text-sm flex items-center justify-center gap-2">
                  {publishing ? (
                    <>
                      <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
                        publishing
                      </span>
                      <span className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-white inline-block"
                            style={{ animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                        ))}
                      </span>
                    </>
                  ) : (
                    <><Upload className="w-4 h-4" /> publish_quiz</>
                  )}
                </button>

              </div>
            </div>
          </div>

          {/* ── Published quizzes list ── */}
          <div className="page-enter stagger-2">
            <SectionRule label={
              loading
                ? "// 02  LOADING..."
                : `// 02  YOUR PUBLICATIONS (${publishedQuizzes.length})`
            } />

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border animate-pulse h-32"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }} />
                ))}
              </div>
            ) : publishedQuizzes.length === 0 ? (
              <div className="text-center py-12 font-mono">
                <div className="text-xs mb-4" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la published/
                  <br />
                  <span className="mt-2 block">// no published quizzes yet</span>
                </div>
                <p className="text-sm text-muted-foreground">Publish your first quiz above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publishedQuizzes.map((quiz) => (
                  <PublishedQuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onUnpublish={handleUnpublish}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

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

export default QuizPublishPage;