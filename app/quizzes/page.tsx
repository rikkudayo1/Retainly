"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle, XCircle, Trophy, Brain, Zap, FileText, ChevronDown,
} from "lucide-react";
import { useGems } from "@/hooks/useGems";

interface StoredFile {
  id: string;
  name: string;
  text: string;
}

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

const QuizPage = () => {
  const { addGems } = useGems();

  const [pageState, setPageState] = useState<PageState>("input");
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
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
    const stored = localStorage.getItem("retainly_files");
    if (stored) setStoredFiles(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setFileDropdownOpen(false);
    if (fileDropdownOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fileDropdownOpen]);

  const handleGenerate = async () => {
    const inputText = selectedFile ? selectedFile.text : pastedText;
    if (!inputText.trim()) {
      setError("Please select a file or paste some text.");
      return;
    }
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
        setError(data.error || "Failed to generate quiz.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (choice: string) => {
    if (answered) return;
    const currentQ = questions[currentIndex];
    const isCorrect = choice.startsWith(currentQ.answer);
    setSelectedAnswer(choice);
    setAnswered(true);
    if (isCorrect) setCorrect((p) => p + 1);
    else setWrong((p) => p + 1);
    setResults((prev) => [...prev, { questionIndex: currentIndex, selected: choice, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const wrongQuestions = results.filter((r) => !r.correct).map((r) => questions[r.questionIndex].question);
      setWeakness(
        wrongQuestions.length === 0
          ? "Perfect score! You have a strong understanding of this topic."
          : `You struggled with ${wrongQuestions.length} out of ${questions.length} questions. Focus on: ${wrongQuestions.map((q, i) => `${i + 1}) ${q}`).join(" | ")}.`
      );

      // Award gems — 10 per correct answer
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

  const getChoiceStyle = (choice: string, q: QuizQuestion): React.CSSProperties => {
    const isCorrect = choice.startsWith(q.answer);
    const isSelected = choice === selectedAnswer;
    if (!answered) return {};
    if (isCorrect) return { borderColor: "#22c55e", backgroundColor: "rgb(34 197 94 / 0.1)", color: "#22c55e" };
    if (isSelected && !isCorrect) return { borderColor: "#ef4444", backgroundColor: "rgb(239 68 68 / 0.1)", color: "#ef4444" };
    return { opacity: 0.4 };
  };

  const gradientBtn: React.CSSProperties = {
    background: "var(--theme-gradient)",
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  };

  // ─── INPUT PAGE ───────────────────────────────────────────────
  if (pageState === "input") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background text-foreground">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: `rgb(var(--theme-glow) / 0.1)` }}>
              <Zap className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
            </div>
            <h1 className="text-3xl font-black">Quiz Generator</h1>
            <p className="text-muted-foreground text-sm">Select a file or paste text to generate a quiz.</p>
            <p className="text-xs" style={{ color: "var(--theme-badge-text)" }}>
              💎 Earn 10 gems per correct answer
            </p>
          </div>

          {storedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground/60">From your library</label>
              <div className="relative mt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setFileDropdownOpen((p) => !p)}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
                  style={{
                    backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    borderColor: fileDropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                    color: selectedFile ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary)" }} />
                    {selectedFile ? selectedFile.name : "Choose a file..."}
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: fileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {fileDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
                    style={{ backgroundColor: "var(--background)", borderColor: `rgb(var(--theme-glow) / 0.2)` }}>
                    {storedFiles.map((f) => (
                      <button key={f.id}
                        onClick={() => { setSelectedFile(f); setPastedText(""); setFileDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-muted-foreground transition-all"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                          (e.currentTarget as HTMLButtonElement).style.color = `var(--theme-badge-text)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = "";
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                        {f.name}
                        {selectedFile?.id === f.id && (
                          <span className="ml-auto text-xs" style={{ color: "var(--theme-primary)" }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground/60">Paste text</label>
            <textarea
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[140px] border"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)`, borderColor: `rgb(var(--theme-glow) / 0.2)` }}
              placeholder="Paste your paragraph or notes here..."
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); if (e.target.value) setSelectedFile(null); }}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:brightness-110"
            style={gradientBtn}>
            {loading ? "Generating Quiz..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // ─── QUIZ PAGE ────────────────────────────────────────────────
  if (pageState === "quiz") {
    const currentQ = questions[currentIndex];
    const progress = (currentIndex / questions.length) * 100;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background text-foreground">
        <div className="w-full max-w-xl space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: "rgb(34 197 94 / 0.1)", color: "#22c55e" }}>
              <CheckCircle className="w-4 h-4" /> {correct}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-2 font-bold px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: "rgb(239 68 68 / 0.1)", color: "#ef4444" }}>
              {wrong} <XCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--theme-gradient)" }} />
          </div>

          <div className="rounded-2xl p-6 border"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.05)` }}>
            <p className="text-base font-semibold leading-relaxed">{currentQ.question}</p>
          </div>

          <div className="space-y-2.5">
            {currentQ.choices.map((choice, i) => (
              <button key={i} onClick={() => handleAnswer(choice)}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: !answered ? `rgb(var(--theme-glow) / 0.2)` : undefined,
                  backgroundColor: !answered ? `rgb(var(--theme-glow) / 0.03)` : undefined,
                  ...getChoiceStyle(choice, currentQ),
                }}
                onMouseEnter={(e) => {
                  if (!answered) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-primary)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answered) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.03)`;
                  }
                }}
              >
                {choice}
              </button>
            ))}
          </div>

          {answered && (
            <div className="space-y-3">
              {currentQ.explanation && (
                <div className="rounded-xl px-4 py-3 text-sm border"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.05)` }}>
                  <span className="font-semibold" style={{ color: "var(--theme-badge-text)" }}>💡 Explanation: </span>
                  <span className="text-muted-foreground">{currentQ.explanation}</span>
                </div>
              )}
              <button onClick={handleNext}
                className="w-full py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all"
                style={gradientBtn}>
                {currentIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTS PAGE ─────────────────────────────────────────────
  if (pageState === "results") {
    const total = questions.length;
    const scorePercent = Math.round((correct / total) * 100);
    const isPerfect = scorePercent === 100;

    return (
      <div className="px-6 py-16 max-w-2xl mx-auto space-y-8 bg-background text-foreground min-h-screen">

        <div className="text-center rounded-3xl p-10 border space-y-3"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, background: `linear-gradient(135deg, rgb(var(--theme-glow) / 0.08), rgb(var(--theme-glow) / 0.02))` }}>
          <Trophy className="w-12 h-12 mx-auto" style={{ color: "var(--theme-primary)" }} />
          <h1 className="text-6xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--theme-gradient)" }}>
            {scorePercent}%
          </h1>
          <p className="text-muted-foreground text-sm">
            {correct} correct · {wrong} wrong out of {total} questions
          </p>
          {isPerfect && (
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--theme-badge-text)" }}>
              🎉 Perfect Score!
            </p>
          )}

          {/* Gems earned banner */}
          {gemsEarned > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-2"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--theme-badge-text)",
                border: `1px solid rgb(var(--theme-glow) / 0.3)`,
              }}
            >
              💎 +{gemsEarned} gems earned!
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 border space-y-3"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Brain className="w-4 h-4" style={{ color: "var(--theme-primary)" }} />
            <span style={{ color: "var(--theme-badge-text)" }}>What You Need To Work On</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{weakness}</p>
        </div>

        <div className="space-y-5">
          <h2 className="text-lg font-bold">Answer Breakdown</h2>
          {questions.map((q, qi) => {
            const result = results.find((r) => r.questionIndex === qi);
            return (
              <div key={qi} className="rounded-2xl border p-4 space-y-3"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                <p className="font-semibold text-sm">{qi + 1}) {q.question}</p>
                <div className="space-y-1.5">
                  {q.choices.map((choice, ci) => {
                    const isCorrect = choice.startsWith(q.answer);
                    const isSelected = result?.selected === choice;
                    return (
                      <div key={ci} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                        style={
                          isCorrect
                            ? { backgroundColor: "rgb(34 197 94 / 0.1)", color: "#22c55e" }
                            : isSelected
                            ? { backgroundColor: "rgb(239 68 68 / 0.1)", color: "#ef4444" }
                            : { color: "var(--muted-foreground)", opacity: 0.6 }
                        }>
                        {isCorrect ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          : isSelected ? <XCircle className="w-3.5 h-3.5 shrink-0" />
                          : <span className="w-3.5 h-3.5 shrink-0" />}
                        {choice}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground pt-1">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => setPageState("input")}
          className="w-full py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all"
          style={gradientBtn}>
          Try Another Quiz
        </button>
      </div>
    );
  }
};

export default QuizPage;