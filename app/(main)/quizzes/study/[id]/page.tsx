"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Trophy, Brain,
  Zap, Terminal, ArrowRight, Gem,
} from "lucide-react";
import { getQuiz, saveQuizScore, Quiz, QuizQuestion, logActivity } from "@/lib/db";
import { useGemsContext } from "@/context/GemsContext";
import { useLanguage } from "@/context/LanguageContext";

const CHOICE_LABELS = ["A", "B", "C", "D"];

interface QuizResult {
  questionIndex: number;
  selected: string;
  correct: boolean;
}

type PageState = "loading" | "notfound" | "quiz" | "results";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

const QuizStudyPage = () => {
  // Route: /quizzes/study/[id]  — [id] is the QUIZ id (not an attempt id)
  const { id: quizId } = useParams<{ id: string }>();
  const router = useRouter();
  const { addGems } = useGemsContext();
  const { t } = useLanguage();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [gemsEarned, setGemsEarned] = useState(0);
  const [weakness, setWeakness] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) { setPageState("notfound"); return; }
    getQuiz(quizId).then((data) => {
      if (!data || !data.questions?.length) { setPageState("notfound"); return; }
      setQuiz(data);
      setQuestions(data.questions);
      setPageState("quiz");
    });
  }, [quizId]);

  const handleAnswer = (choice: string) => {
    if (answered) return;
    const isCorrect = choice === questions[currentIndex].answer;
    setSelectedAnswer(choice);
    setAnswered(true);
    if (isCorrect) setCorrect((p) => p + 1);
    else setWrong((p) => p + 1);
    setResults((prev) => [...prev, { questionIndex: currentIndex, selected: choice, correct: isCorrect }]);
  };

  const handleNext = async () => {
    const isLastQuestion = currentIndex + 1 >= questions.length;

    if (isLastQuestion) {
      const lastResult: QuizResult = {
        questionIndex: currentIndex,
        selected: selectedAnswer!,
        correct: selectedAnswer === questions[currentIndex].answer,
      };
      const allResults = [
        ...results.filter((r) => r.questionIndex !== currentIndex),
        lastResult,
      ];
      const finalCorrect = allResults.filter((r) => r.correct).length;
      const finalWrong = allResults.length - finalCorrect;

      const wrongQuestions = allResults
        .filter((r) => !r.correct)
        .map((r) => questions[r.questionIndex].question);

      setWeakness(
        wrongQuestions.length === 0
          ? t("quiz.perfect")
          : wrongQuestions.map((q, i) => `${i + 1}) ${q}`).join(" | ")
      );

      setCorrect(finalCorrect);
      setWrong(finalWrong);

      const earned = finalCorrect * 10;
      addGems(earned);
      setGemsEarned(earned);

      if (quiz) {
        setSaving(true);
        await saveQuizScore(quiz.id, finalCorrect);
        setSaving(false);
      }

      setPageState("results");
      await logActivity();
    } else {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setResults([]);
    setSelectedAnswer(null);
    setAnswered(false);
    setCorrect(0);
    setWrong(0);
    setGemsEarned(0);
    setWeakness("");
    setPageState("quiz");
  };

  const getChoiceState = (choice: string, q: QuizQuestion): "correct" | "wrong" | "dim" | "idle" => {
    if (!answered) return "idle";
    if (choice === q.answer) return "correct";
    if (choice === selectedAnswer) return "wrong";
    return "dim";
  };

  // ── Loading ──
  if (pageState === "loading") return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  // ── Not found ──
  if (pageState === "notfound") return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="font-mono text-sm" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// 404</p>
      <p className="font-bold text-lg">Quiz not found</p>
      <button onClick={() => router.push("/quizzes")}
        className="text-sm font-mono mt-2" style={{ color: "var(--theme-primary)" }}>
        ← back_to_quizzes
      </button>
    </div>
  );

  // ── Quiz ──
  if (pageState === "quiz") {
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

    return (
      <>
        <style>{`
          @keyframes choiceIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes explanationIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          .choice-enter { animation: choiceIn 0.2s cubic-bezier(0.22,1,0.36,1) forwards; }
          .explanation-enter { animation: explanationIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
        `}</style>

        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-xl space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-mono text-[11px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                  <span className="truncate max-w-[160px]">{quiz?.title}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 font-bold">{correct}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-red-400 font-bold">{wrong}</span>
                  </span>
                </div>
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
                      borderColor: state === "correct" ? "#22c55e" : state === "wrong" ? "#ef4444" : state === "dim" ? `rgb(var(--theme-glow) / 0.08)` : `rgb(var(--theme-glow) / 0.18)`,
                      backgroundColor: state === "correct" ? "rgb(34 197 94 / 0.07)" : state === "wrong" ? "rgb(239 68 68 / 0.07)" : state === "dim" ? `rgb(var(--theme-glow) / 0.01)` : `rgb(var(--theme-glow) / 0.02)`,
                      color: state === "correct" ? "#22c55e" : state === "wrong" ? "#ef4444" : state === "dim" ? `rgb(var(--theme-glow) / 0.3)` : "var(--foreground)",
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
                    <span className="font-mono text-[10px] w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                      style={{
                        borderColor: state === "correct" ? "#22c55e" : state === "wrong" ? "#ef4444" : `rgb(var(--theme-glow) / 0.2)`,
                        color: state === "correct" ? "#22c55e" : state === "wrong" ? "#ef4444" : `rgb(var(--theme-glow) / 0.5)`,
                      }}>
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
                  disabled={saving}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}
                >
                  {currentIndex + 1 >= questions.length
                    ? saving ? "saving..." : <><Trophy className="w-4 h-4" /> {t("quiz.results")}</>
                    : <>{t("quiz.next")} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Results ──
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
            <div className="page-enter space-y-2">
              <div className="flex items-center gap-2 font-mono text-[11px] mb-5"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/quizzes/results</span>
              </div>

              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                  <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    // session_complete · {quiz?.title}
                  </span>
                  {isPerfect && (
                    <span className="font-mono text-[10px]" style={{ color: "#22c55e" }}>✓ perfect_score</span>
                  )}
                </div>

                <div className="p-8 flex flex-col items-center gap-4 text-center">
                  <div className="score-enter">
                    <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--theme-primary)" }} />
                    <div className="text-7xl font-black tracking-tight leading-none" style={{ color: "var(--theme-primary)" }}>
                      {scorePercent}
                      <span className="text-3xl font-bold text-muted-foreground">%</span>
                    </div>
                  </div>

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
                  <span className="font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>work_on</span>
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
                      <div className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: isCorrectResult ? "rgb(34 197 94 / 0.12)" : "rgb(239 68 68 / 0.12)" }}>
                        <span className="font-mono text-[10px]" style={{ color: isCorrectResult ? "#22c55e" : "#ef4444" }}>
                          {isCorrectResult ? "✓" : "✗"} Q{String(qi + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm font-semibold flex-1">{q.question}</p>
                      </div>
                      <div className="p-3 space-y-1">
                        {q.choices.map((choice, ci) => {
                          const isCorrectChoice = choice === q.answer;
                          const isSelectedChoice = result?.selected === choice;
                          return (
                            <div key={ci}
                              className="flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg font-mono"
                              style={{
                                backgroundColor: isCorrectChoice ? "rgb(34 197 94 / 0.08)" : isSelectedChoice ? "rgb(239 68 68 / 0.08)" : "transparent",
                                color: isCorrectChoice ? "#22c55e" : isSelectedChoice ? "#ef4444" : `rgb(var(--theme-glow) / 0.35)`,
                              }}>
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
                          <p className="font-mono text-[10px] mb-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// explanation</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/quizzes")}
                className="flex-1 py-3 rounded-xl font-bold text-sm font-mono transition-all flex items-center justify-center gap-2 hover:opacity-80"
                style={{ border: `1px solid rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)`, color: "var(--theme-badge-text)" }}
              >
                ← my_quizzes
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-xl font-bold text-sm font-mono transition-all flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: "var(--theme-primary)", color: "#fff" }}
              >
                <Zap className="w-4 h-4" /> retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default QuizStudyPage;