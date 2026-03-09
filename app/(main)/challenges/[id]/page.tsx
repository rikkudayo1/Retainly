"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Trophy, Terminal,
  ArrowRight, Swords, Loader2, Gem,
} from "lucide-react";
import {
  getChallenge, getQuiz, saveQuizScore, completeChallenge, logActivity,
  Challenge, Quiz, QuizQuestion,
} from "@/lib/db";
import { createClient } from "@/lib/supabase";
import { useGemsContext } from "@/context/GemsContext";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type PageState = "loading" | "notfound" | "unauthorized" | "lobby" | "quiz" | "results";

interface QuizResult {
  questionIndex: number;
  selected: string;
  correct: boolean;
}

// ── Score comparison card ─────────────────────────────────────
const ScoreCard = ({
  label, username, avatar, score, total, isWinner, t,
}: {
  label: string; username: string; avatar: string | null | undefined;
  score: number; total: number; isWinner: boolean;
  t: (key: TranslationKey) => string;
}) => {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="flex-1 rounded-2xl border p-5 flex flex-col items-center gap-3 text-center"
      style={{
        borderColor: isWinner ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: isWinner ? `rgb(var(--theme-glow) / 0.06)` : `rgb(var(--theme-glow) / 0.02)`,
        boxShadow: isWinner ? `0 0 20px rgb(var(--theme-glow) / 0.08)` : "none",
      }}>
      <div className="w-12 h-12 rounded-xl overflow-hidden"
        style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
        {avatar ? (
          <img src={avatar} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-black text-lg"
            style={{ color: "var(--theme-primary)" }}>
            {username?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
      <div>
        <p className="font-bold text-sm">{username}</p>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>{label}</p>
      </div>
      <div className="text-4xl font-black" style={{ color: isWinner ? "var(--theme-primary)" : "var(--foreground)" }}>
        {pct}<span className="text-xl font-bold text-muted-foreground">%</span>
      </div>
      <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
        {t("cd.score_correct").replace("{n}", String(score)).replace("{total}", String(total))}
      </p>
      {isWinner && (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded"
          style={{ backgroundColor: "var(--theme-primary)", color: "#fff" }}>
          {t("cd.score_winner")}
        </span>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
const ChallengePage = () => {
  const { t } = useLanguage();
  const { id: challengeId } = useParams<{ id: string }>();
  const router = useRouter();
  const { addGems } = useGemsContext();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [gemsEarned, setGemsEarned] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!challengeId) { setPageState("notfound"); return; }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setCurrentUserId(user.id);

      const c = await getChallenge(challengeId);
      if (!c) { setPageState("notfound"); return; }

      // Only the challengee can view this page
      if (c.challengee_id !== user.id) { setPageState("unauthorized"); return; }

      setChallenge(c);

      // If already completed, go straight to results
      if (c.status === "completed") {
        const q = await getQuiz(c.quiz_id);
        if (q) { setQuiz(q); setQuestions(q.questions); }
        setCorrect(c.challengee_score ?? 0);
        setPageState("results");
        return;
      }

      if (c.status === "expired") { setPageState("notfound"); return; }

      setPageState("lobby");
    };
    load();
  }, [challengeId, router]);

  const startQuiz = async () => {
    if (!challenge) return;
    const q = await getQuiz(challenge.quiz_id);
    if (!q) { setPageState("notfound"); return; }
    setQuiz(q);
    setQuestions(q.questions);
    setPageState("quiz");
  };

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
    const isLast = currentIndex + 1 >= questions.length;
    if (!isLast) {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      return;
    }

    // Final question
    const lastResult: QuizResult = {
      questionIndex: currentIndex,
      selected: selectedAnswer!,
      correct: selectedAnswer === questions[currentIndex].answer,
    };
    const allResults = [...results.filter((r) => r.questionIndex !== currentIndex), lastResult];
    const finalCorrect = allResults.filter((r) => r.correct).length;
    setCorrect(finalCorrect);
    setWrong(allResults.length - finalCorrect);

    const earned = finalCorrect * 10;
    addGems(earned);
    setGemsEarned(earned);

    setSaving(true);
    if (quiz) await saveQuizScore(quiz.id, finalCorrect);
    if (challenge) await completeChallenge(challenge.id, finalCorrect);
    setSaving(false);

    setPageState("results");
    await logActivity();
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
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (pageState === "notfound" || pageState === "unauthorized") return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="font-mono text-sm" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
        {pageState === "unauthorized" ? t("cd.unauthorized") : t("cd.notfound")}
      </p>
      <button onClick={() => router.push("/quizzes")}
        className="text-sm font-mono mt-2" style={{ color: "var(--theme-primary)" }}>
        {t("cd.back")}
      </button>
    </div>
  );

  // ── Lobby ── (show challenger's score, accept button)
  if (pageState === "lobby" && challenge) {
    const challengerPct = Math.round((challenge.challenger_score / challenge.question_count) * 100);
    return (
      <>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        `}</style>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-md space-y-6 page-enter">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>{t("cd.breadcrumb")}</span>
            </div>

            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <div className="px-4 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                <Swords className="w-3.5 h-3.5" style={{ color: "var(--theme-primary)" }} />
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  {t("cd.lobby_header")}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Challenger info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
                    {challenge.challenger_avatar ? (
                      <img src={challenge.challenger_avatar} alt={challenge.challenger_username ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-sm"
                        style={{ color: "var(--theme-primary)" }}>
                        {challenge.challenger_username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">@{challenge.challenger_username}</p>
                    <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      {t("cd.challenges_you")}
                    </p>
                  </div>
                </div>

                {/* Quiz info */}
                <div className="rounded-xl border px-4 py-3"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                  <p className="font-mono text-[10px] mb-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                    {t("cd.lobby_quiz_label")}
                  </p>
                  <p className="font-bold text-sm">{challenge.quiz_title}</p>
                  <p className="font-mono text-[10px] mt-1" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                    {t("cd.lobby_questions").replace("{n}", String(challenge.question_count))}
                  </p>
                </div>

                {/* Target to beat */}
                <div className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ borderColor: "rgb(var(--theme-glow) / 0.12)", backgroundColor: "rgb(var(--theme-glow) / 0.02)" }}>
                  <span className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    {t("cd.lobby_score_label")}
                  </span>
                  <span className="font-black text-2xl" style={{ color: "var(--theme-primary)" }}>
                    {challengerPct}<span className="text-base font-bold text-muted-foreground">%</span>
                  </span>
                </div>

                <button
                  onClick={startQuiz}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}
                >
                  <Swords className="w-4 h-4" /> {t("cd.accept_btn")}
                </button>
              </div>
            </div>

            {/* Expires note */}
            <p className="text-center font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
              {t("cd.expires").replace("{date}", new Date(challenge.expires_at).toLocaleDateString())}
            </p>
          </div>
        </div>
      </>
    );
  }

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[11px]"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Swords className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span className="truncate max-w-[200px]">{quiz?.title}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-emerald-400 font-bold">{correct}</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>/</span>
                <span className="text-red-400 font-bold">{wrong}</span>
                <span className="ml-1" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  {String(currentIndex + 1).padStart(2, "0")}/{String(questions.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="relative h-0.5 rounded-full overflow-hidden"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: "var(--theme-primary)" }} />
            </div>

            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.08)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  // question_{String(currentIndex + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] flex items-center gap-1"
                  style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <Swords className="w-3 h-3" /> {t("cd.challenge_mode")}
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="text-base font-semibold leading-relaxed">{currentQ.question}</p>
              </div>
            </div>

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
                      backgroundColor: state === "correct" ? "rgb(34 197 94 / 0.07)" : state === "wrong" ? "rgb(239 68 68 / 0.07)" : `rgb(var(--theme-glow) / 0.02)`,
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

            {answered && (
              <div className="explanation-enter space-y-3">
                {currentQ.explanation && (
                  <div className="rounded-xl border px-4 py-3.5 text-sm"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                    <span className="font-mono text-[10px] block mb-1.5"
                      style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      {t("cd.explanation")}
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
                    ? saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("cd.saving")}</>
                      : <><Trophy className="w-4 h-4" /> {t("cd.see_results")}</>
                    : <>{t("cd.next")} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Results ──
  if (pageState === "results" && challenge) {
    const challengerScore = challenge.challenger_score;
    const challengeeScore = correct;
    const total = challenge.question_count;
    const challengerWon = challengerScore > challengeeScore;
    const challengeeWon = challengeeScore > challengerScore;
    const tie = challengerScore === challengeeScore;

    return (
      <>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scoreIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
          .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
          .score-enter { animation: scoreIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        `}</style>

        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-xl mx-auto px-5 pt-14 pb-24 space-y-8">

            <div className="page-enter">
              <div className="flex items-center gap-2 font-mono text-[11px] mb-6"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>{t("cd.breadcrumb_results")}</span>
              </div>

              {/* Verdict banner */}
              <div className="rounded-2xl border p-5 text-center mb-6 score-enter"
                style={{
                  borderColor: tie ? `rgb(var(--theme-glow) / 0.2)` : challengeeWon ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.15)`,
                  backgroundColor: tie ? `rgb(var(--theme-glow) / 0.03)` : challengeeWon ? `rgb(var(--theme-glow) / 0.06)` : `rgb(var(--theme-glow) / 0.02)`,
                }}>
                <Trophy className="w-8 h-8 mx-auto mb-2"
                  style={{ color: challengeeWon ? "var(--theme-primary)" : tie ? "#f59e0b" : `rgb(var(--theme-glow) / 0.3)` }} />
                <p className="text-2xl font-black">
                  {tie ? t("cd.verdict_tie") : challengeeWon ? t("cd.verdict_won") : t("cd.verdict_lost")}
                </p>
                <p className="font-mono text-xs mt-1" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  {tie
                    ? t("cd.verdict_tie_sub")
                    : challengeeWon
                      ? t("cd.verdict_won_sub")
                      : t("cd.verdict_lost_sub").replace("{user}", challenge.challenger_username ?? "")}
                </p>
                {gemsEarned > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-3 font-mono text-xs"
                    style={{ color: "var(--theme-badge-text)" }}>
                    <Gem className="w-3.5 h-3.5" /> {t("cd.gems_earned").replace("{n}", String(gemsEarned))}
                  </div>
                )}
              </div>

              {/* Side-by-side score comparison */}
              <div className="flex gap-3">
                <ScoreCard
                  label={t("cd.score_challenger")}
                  username={`@${challenge.challenger_username ?? "?"}`}
                  avatar={challenge.challenger_avatar}
                  score={challengerScore}
                  total={total}
                  isWinner={challengerWon}
                  t={t}
                />
                <ScoreCard
                  label={t("cd.score_you")}
                  username={`@${challenge.challengee_username ?? "you"}`}
                  avatar={challenge.challengee_avatar}
                  score={challengeeScore}
                  total={total}
                  isWinner={challengeeWon}
                  t={t}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="page-enter flex gap-3" style={{ animationDelay: "120ms" }}>
              <button
                onClick={() => router.push("/quizzes")}
                className="flex-1 py-3 rounded-xl font-bold text-sm font-mono transition-all flex items-center justify-center gap-2"
                style={{ border: `1px solid rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)`, color: "var(--theme-badge-text)" }}
              >
                {t("cd.action_quizzes")}
              </button>
              {quiz && (
                <button
                  onClick={() => router.push(`/quizzes/study/${quiz.id}`)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm font-mono transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}
                >
                  <ArrowRight className="w-4 h-4" /> {t("cd.action_study")}
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default ChallengePage;