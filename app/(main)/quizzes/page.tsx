"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Brain,
  Zap,
  FileText,
  ChevronDown,
  Terminal,
  ArrowRight,
  Gem,
} from "lucide-react";
import { useGemsContext } from "@/context/GemsContext";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, DBFile } from "@/lib/db";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  explanation?: string;
}
interface QuizResult {
  questionIndex: number;
  selected: string;
  correct: boolean;
}
type PageState = "input" | "quiz" | "results";

const CHOICE_LABELS = ["A", "B", "C", "D"];

// ─── Shared section rule ──────────────────────────────────────
const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

const QuizPage = () => {
  const { addGems } = useGemsContext();
  const { t } = useLanguage();

  const [pageState, setPageState] = useState<PageState>("input");
  const [storedFiles, setStoredFiles] = useState<DBFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DBFile | null>(null);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState("");
  const [gemsEarned, setGemsEarned] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [weakness, setWeakness] = useState("");

  useEffect(() => {
    getFiles().then((data) => { setStoredFiles(data); setLoadingFiles(false); });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setFileDropdownOpen(false);
    if (fileDropdownOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fileDropdownOpen]);

  const handleGenerate = async () => {
    const inputText = selectedFile ? selectedFile.text : pastedText;
    if (!inputText.trim()) { setError(t("quiz.error.empty")); return; }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", inputText);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.output.quiz);
        setCurrentIndex(0);
        setResults([]);
        setSelectedAnswer(null);
        setAnswered(false);
        setCorrect(0);
        setWrong(0);
        setGemsEarned(0);
        setPageState("quiz");
      } else {
        setError(data.error || t("quiz.error.failed"));
      }
    } catch {
      setError(t("quiz.error.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (choice: string) => {
    if (answered) return;
    const isCorrect = choice.startsWith(questions[currentIndex].answer);
    setSelectedAnswer(choice);
    setAnswered(true);
    if (isCorrect) setCorrect((p) => p + 1);
    else setWrong((p) => p + 1);
    setResults((prev) => [...prev, { questionIndex: currentIndex, selected: choice, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const wrongQ = results.filter((r) => !r.correct).map((r) => questions[r.questionIndex].question);
      setWeakness(wrongQ.length === 0 ? t("quiz.perfect") : `${wrongQ.map((q, i) => `${i + 1}) ${q}`).join(" | ")}`);
      const earned = correct * 10;
      addGems(earned);
      setGemsEarned(earned);
      setPageState("results");
    } else {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const getChoiceState = (choice: string, q: QuizQuestion): "correct" | "wrong" | "dim" | "idle" => {
    if (!answered) return "idle";
    const isCorrect = choice.startsWith(q.answer);
    const isSelected = choice === selectedAnswer;
    if (isCorrect) return "correct";
    if (isSelected && !isCorrect) return "wrong";
    return "dim";
  };

  // ─── INPUT ───────────────────────────────────────────────────
  if (pageState === "input") return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .skeleton-pulse {
          background: linear-gradient(90deg, rgb(var(--theme-glow)/0.06) 0%, rgb(var(--theme-glow)/0.1) 50%, rgb(var(--theme-glow)/0.06) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-8 page-enter">

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quiz</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">{t("quiz.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("quiz.subtitle")}</p>
            <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
              // {t("quiz.gems_hint")}
            </p>
          </div>

          {/* Input card */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>

            {/* Titlebar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
              <span className="w-2 h-2 rounded-full bg-red-400/50" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
              <span className="w-2 h-2 rounded-full bg-green-400/50" />
              <span className="ml-3 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                generate_quiz.sh
              </span>
            </div>

            <div className="p-5 space-y-5">

              {/* File selector */}
              <div className="space-y-2">
                <p className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  // from library
                </p>
                {loadingFiles ? (
                  <div className="h-10 rounded-xl skeleton-pulse" />
                ) : (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setFileDropdownOpen((p) => !p)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 border font-mono text-xs transition-all duration-150"
                      style={{
                        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                        borderColor: fileDropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.18)`,
                        color: selectedFile ? "var(--foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: selectedFile ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.35)` }} />
                        <span className="truncate">{selectedFile ? selectedFile.name : "choose_file..."}</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                        style={{ transform: fileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }} />
                    </button>

                    {fileDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden"
                        style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.18)` }}>
                        <div className="px-3 py-2 border-b font-mono text-[10px]"
                          style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, color: `rgb(var(--theme-glow) / 0.35)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                          // library
                        </div>
                        {storedFiles.length === 0 ? (
                          <p className="font-mono text-xs px-4 py-3" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                            // no files found
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto p-1.5">
                            {storedFiles.map((f) => (
                              <button key={f.id}
                                onClick={() => { setSelectedFile(f); setPastedText(""); setFileDropdownOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-all"
                                style={{ color: selectedFile?.id === f.id ? "var(--theme-badge-text)" : "var(--muted-foreground)", backgroundColor: selectedFile?.id === f.id ? `rgb(var(--theme-glow) / 0.08)` : "transparent" }}
                                onMouseEnter={(e) => { if (selectedFile?.id !== f.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`; }}
                                onMouseLeave={(e) => { if (selectedFile?.id !== f.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                                <span className="truncate">{f.name}</span>
                                {selectedFile?.id === f.id && <span className="ml-auto" style={{ color: "var(--theme-primary)" }}>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>// or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
              </div>

              {/* Paste text */}
              <div className="space-y-2">
                <p className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  // paste text
                </p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b font-mono text-[10px]"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.35)` }}>
                    <span style={{ color: "var(--theme-primary)" }}>$</span>
                    <span>stdin</span>
                  </div>
                  <textarea
                    className="w-full resize-none px-4 py-3 text-sm outline-none min-h-[120px] bg-transparent placeholder:text-muted-foreground/30 leading-relaxed"
                    style={{ color: "var(--foreground)" }}
                    placeholder={t("quiz.placeholder")}
                    value={pastedText}
                    onChange={(e) => { setPastedText(e.target.value); if (e.target.value) setSelectedFile(null); }}
                  />
                </div>
              </div>

              {error && (
                <p className="font-mono text-xs" style={{ color: "rgb(239 68 68)" }}>
                  // error: {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || (!selectedFile && pastedText.trim().length === 0)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-35"
                style={{ background: "var(--theme-primary)", color: "#fff" }}
              >
                {loading ? (
                  <span className="font-mono text-xs">generating...</span>
                ) : (
                  <><Zap className="w-4 h-4" /> {t("quiz.generate")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ─── QUIZ ────────────────────────────────────────────────────
  if (pageState === "quiz") {
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

    return (
      <>
        <style>{`
          @keyframes choiceIn {
            from { opacity: 0; transform: translateX(-6px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes explanationIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .choice-enter { animation: choiceIn 0.2s cubic-bezier(0.22,1,0.36,1) forwards; }
          .explanation-enter { animation: explanationIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
        `}</style>

        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-xl space-y-6">

            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 font-mono text-xs"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 font-bold">{correct}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-red-400 font-bold">{wrong}</span>
                </span>
              </div>

              <span className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                {String(currentIndex + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-0.5 rounded-full overflow-hidden"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: "var(--theme-primary)" }} />
            </div>

            {/* Question card */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  // question_{String(currentIndex + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  {questions.length - currentIndex - 1} remaining
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="text-base font-semibold leading-relaxed">{currentQ.question}</p>
              </div>
            </div>

            {/* Choices */}
            <div className="space-y-2.5">
              {currentQ.choices.map((choice, i) => {
                const state = getChoiceState(choice, currentQ);
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(choice)}
                    disabled={answered}
                    className="choice-enter w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center gap-3"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      borderColor: state === "correct" ? "#22c55e"
                        : state === "wrong" ? "#ef4444"
                        : state === "dim" ? `rgb(var(--theme-glow) / 0.08)`
                        : `rgb(var(--theme-glow) / 0.18)`,
                      backgroundColor: state === "correct" ? "rgb(34 197 94 / 0.07)"
                        : state === "wrong" ? "rgb(239 68 68 / 0.07)"
                        : state === "dim" ? `rgb(var(--theme-glow) / 0.01)`
                        : `rgb(var(--theme-glow) / 0.02)`,
                      color: state === "correct" ? "#22c55e"
                        : state === "wrong" ? "#ef4444"
                        : state === "dim" ? `rgb(var(--theme-glow) / 0.3)`
                        : "var(--foreground)",
                      opacity: state === "dim" ? 0.5 : 1,
                      cursor: answered ? "default" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!answered) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-primary)";
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.07)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!answered) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.18)`;
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.02)`;
                      }
                    }}
                  >
                    {/* Choice label */}
                    <span
                      className="font-mono text-[10px] w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                      style={{
                        borderColor: state === "correct" ? "#22c55e"
                          : state === "wrong" ? "#ef4444"
                          : `rgb(var(--theme-glow) / 0.2)`,
                        color: state === "correct" ? "#22c55e"
                          : state === "wrong" ? "#ef4444"
                          : `rgb(var(--theme-glow) / 0.5)`,
                      }}
                    >
                      {CHOICE_LABELS[i] ?? i + 1}
                    </span>
                    <span className="flex-1">{choice}</span>
                    {state === "correct" && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#22c55e" }} />}
                    {state === "wrong" && <XCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />}
                  </button>
                );
              })}
            </div>

            {/* Explanation + next */}
            {answered && (
              <div className="explanation-enter space-y-3">
                {currentQ.explanation && (
                  <div className="rounded-xl border px-4 py-3.5 text-sm"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                    <span className="font-mono text-[10px] block mb-1.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      // explanation
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{currentQ.explanation}</span>
                  </div>
                )}
                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}
                >
                  {currentIndex + 1 >= questions.length ? (
                    <><Trophy className="w-4 h-4" /> {t("quiz.results")}</>
                  ) : (
                    <>{t("quiz.next")} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────────
  if (pageState === "results") {
    const total = questions.length;
    const scorePercent = Math.round((correct / total) * 100);
    const isPerfect = scorePercent === 100;

    return (
      <>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scoreIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
          .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
          .score-enter { animation: scoreIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          .result-row { animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        `}</style>

        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-2xl mx-auto px-5 pt-14 pb-24 space-y-10">

            {/* Score hero */}
            <div className="page-enter space-y-2">
              <div className="flex items-center gap-2 font-mono text-[11px] mb-5"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/quiz/results</span>
              </div>

              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>

                <div className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                  <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    // session_complete
                  </span>
                  {isPerfect && (
                    <span className="font-mono text-[10px]" style={{ color: "#22c55e" }}>
                      ✓ perfect_score
                    </span>
                  )}
                </div>

                <div className="p-8 flex flex-col items-center gap-4 text-center">
                  <div className="score-enter">
                    <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--theme-primary)" }} />
                    <div className="text-7xl font-black tracking-tight leading-none"
                      style={{ color: "var(--theme-primary)" }}>
                      {scorePercent}
                      <span className="text-3xl font-bold text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div className="flex items-center gap-3 font-mono text-xs mt-1">
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                      style={{ borderColor: "rgb(34 197 94 / 0.3)", backgroundColor: "rgb(34 197 94 / 0.07)", color: "#22c55e" }}>
                      <CheckCircle className="w-3 h-3" /> {correct} correct
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                      style={{ borderColor: "rgb(239 68 68 / 0.3)", backgroundColor: "rgb(239 68 68 / 0.07)", color: "#ef4444" }}>
                      <XCircle className="w-3 h-3" /> {wrong} wrong
                    </span>
                    {gemsEarned > 0 && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                        style={{ borderColor: `rgb(var(--theme-glow) / 0.3)`, backgroundColor: `rgb(var(--theme-glow) / 0.07)`, color: "var(--theme-badge-text)" }}>
                        <Gem className="w-3 h-3" /> +{gemsEarned}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weakness */}
            <div className="page-enter" style={{ animationDelay: "80ms" }}>
              <SectionRule label="// ANALYSIS" />
              <div className="rounded-xl border px-5 py-4"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
                  <span className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
                    work_on
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{weakness}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="page-enter" style={{ animationDelay: "140ms" }}>
              <SectionRule label="// BREAKDOWN" />
              <div className="space-y-3">
                {questions.map((q, qi) => {
                  const result = results.find((r) => r.questionIndex === qi);
                  const isCorrectResult = result?.correct;
                  return (
                    <div key={qi} className="result-row rounded-2xl border overflow-hidden"
                      style={{
                        animationDelay: `${140 + qi * 60}ms`,
                        borderColor: isCorrectResult ? "rgb(34 197 94 / 0.2)" : "rgb(239 68 68 / 0.2)",
                        backgroundColor: isCorrectResult ? "rgb(34 197 94 / 0.03)" : "rgb(239 68 68 / 0.03)",
                      }}>

                      {/* Question header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: isCorrectResult ? "rgb(34 197 94 / 0.12)" : "rgb(239 68 68 / 0.12)" }}>
                        <span className="font-mono text-[10px]"
                          style={{ color: isCorrectResult ? "#22c55e" : "#ef4444" }}>
                          {isCorrectResult ? "✓" : "✗"} Q{String(qi + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm font-semibold flex-1">{q.question}</p>
                      </div>

                      {/* Choices */}
                      <div className="p-3 space-y-1">
                        {q.choices.map((choice, ci) => {
                          const isCorrectChoice = choice.startsWith(q.answer);
                          const isSelectedChoice = result?.selected === choice;
                          return (
                            <div key={ci}
                              className="flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg font-mono"
                              style={{
                                backgroundColor: isCorrectChoice ? "rgb(34 197 94 / 0.08)"
                                  : isSelectedChoice ? "rgb(239 68 68 / 0.08)"
                                  : "transparent",
                                color: isCorrectChoice ? "#22c55e"
                                  : isSelectedChoice ? "#ef4444"
                                  : `rgb(var(--theme-glow) / 0.35)`,
                              }}
                            >
                              <span className="w-4 shrink-0">
                                {isCorrectChoice ? "✓" : isSelectedChoice ? "✗" : CHOICE_LABELS[ci]}
                              </span>
                              <span className="flex-1">{choice}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="px-4 pb-3">
                          <p className="font-mono text-[10px] mb-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                            // explanation
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retry */}
            <button
              onClick={() => setPageState("input")}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              <Zap className="w-4 h-4" /> {t("quiz.retry")}
            </button>
          </div>
        </div>
      </>
    );
  }
};

export default QuizPage;