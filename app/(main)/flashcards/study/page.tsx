"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useGemsContext } from "@/context/GemsContext";
import { Suspense } from "react";
import { CheckCircle, XCircle, Minus, LayersIcon, Sparkles } from "lucide-react";
import { getDeck, DBDeck, DBCard, logActivity } from "@/lib/db";

type CardState = "keyword" | "hint" | "answer";
type CardResult = "got_it" | "unsure" | "missed";
type PageState = "study" | "complete";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-5">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

const StudyContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("id");
  const { t } = useLanguage();
  const { addGems } = useGemsContext();

  const [pageState, setPageState] = useState<PageState>("study");
  const [deck, setDeck] = useState<DBDeck | null>(null);
  const [studyDeck, setStudyDeck] = useState<DBCard[]>([]);
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [cardState, setCardState] = useState<CardState>("keyword");
  const [gotIt, setGotIt] = useState(0);
  const [missed, setMissed] = useState(0);
  const [unsure, setUnsure] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [gemsEarned, setGemsEarned] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    getDeck(deckId).then((found) => {
      if (found) {
        setDeck(found);
        setStudyDeck([...(found.cards ?? [])]);
      }
      setLoadingDeck(false);
    });
  }, [deckId]);

  const handleResult = (result: CardResult) => {
    setAnimating(true);
    setTimeout(async () => {
      const remaining = [...studyDeck];
      const current = remaining[0];
      if (result === "got_it") {
        setGotIt((p) => p + 1);
        remaining.shift();
      } else {
        if (result === "unsure") setUnsure((p) => p + 1);
        if (result === "missed") setMissed((p) => p + 1);
        remaining.shift();
        remaining.push(current);
      }
      if (remaining.length === 0) {
        const earned = (gotIt + 1) * 5;
        await addGems(earned);
        setGemsEarned(earned);
        setPageState("complete");
        await logActivity();
        return;
      }
      setStudyDeck(remaining);
      setCardState("keyword");
      setAnimating(false);
    }, 200);
  };

  const progress = deck ? (gotIt / (gotIt + studyDeck.length)) * 100 : 0;
  const total = gotIt + missed + unsure;

  // ── Loading ────────────────────────────────────────────────────
  if (loadingDeck) {
    return (
      <>
        <NoiseAndBloom />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="space-y-3 text-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }}
            />
            <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              loading deck...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!deck) {
    return (
      <>
        <NoiseAndBloom />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div
            className="font-mono text-xs px-4 py-3 rounded-xl border"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: `rgb(var(--theme-glow) / 0.5)`,
            }}
          >
            <span style={{ color: "var(--theme-primary)" }}>!</span> deck not found
          </div>
        </div>
      </>
    );
  }

  // ── Complete ───────────────────────────────────────────────────
  if (pageState === "complete") {
    const scorePercent = total > 0 ? Math.round((gotIt / total) * 100) : 0;
    const scoreColor = scorePercent >= 80 ? "#22c55e" : scorePercent >= 50 ? "#eab308" : "#ef4444";

    return (
      <>
        <style>{completeStyles}</style>
        <NoiseAndBloom />
        <div className="relative z-10 min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="w-full max-w-xl">

            {/* Header */}
            <div className="complete-enter mb-10 text-center">
              <div
                className="flex items-center justify-center gap-2 font-mono text-[11px] mb-7"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
              >
                <LayersIcon className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/flashcards/complete</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
                {t("study.complete")}
              </h1>
              <p className="text-muted-foreground text-sm font-mono">{deck.title}</p>
            </div>

            {/* Score block */}
            <div
              className="complete-enter stagger-1 rounded-2xl border p-6 mb-6 flex items-center gap-6"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.18)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              {/* Score ring */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-4 shrink-0"
                style={{ borderColor: scoreColor, backgroundColor: `${scoreColor}10` }}
              >
                <span className="text-2xl font-black" style={{ color: scoreColor }}>
                  {scorePercent}%
                </span>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>got_it</span>
                  <span className="font-bold" style={{ color: "#22c55e" }}>{gotIt}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                <div className="flex items-center justify-between">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>unsure</span>
                  <span className="font-bold" style={{ color: "#eab308" }}>{unsure}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                <div className="flex items-center justify-between">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>missed</span>
                  <span className="font-bold" style={{ color: "#ef4444" }}>{missed}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
                <div className="flex items-center justify-between">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>total</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
              </div>
            </div>

            {/* Gems */}
            {gemsEarned > 0 && (
              <div
                className="complete-enter stagger-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border mb-6 font-mono text-sm"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                <span>💎</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>earned</span>
                <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>
                  +{gemsEarned}
                </span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
                  {t("study.gems_earned")}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="complete-enter stagger-3 flex gap-3">
              <button
                onClick={() => router.push("/flashcards/decks")}
                className="action-btn flex-1 py-3 rounded-xl text-sm font-semibold border font-mono transition-all"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  color: "var(--theme-badge-text)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                {t("study.view_decks")}
              </button>
              <button
                onClick={() => router.push("/flashcards")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{
                  background: "var(--theme-primary)",
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                {t("study.new_flash")}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-12 flex items-center gap-4">
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
  }

  // ── Study ──────────────────────────────────────────────────────
  const currentCard = studyDeck[0];
  const cardStateLabel =
    cardState === "keyword" ? t("study.keyword")
    : cardState === "hint" ? t("study.hint")
    : t("study.answer");

  return (
    <>
      <style>{studyStyles}</style>
      <NoiseAndBloom />

      <div className="relative z-10 min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-xl">

          {/* ── Header ─────────────────────────────────── */}
          <div className="study-enter mb-8">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-5"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <LayersIcon className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/flashcards/study</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span className="truncate max-w-[160px]">{deck.title}</span>
            </div>

            {/* Progress bar */}
            <div
              className="w-full h-1 rounded-full overflow-hidden mb-3"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: "var(--theme-primary)" }}
              />
            </div>

            {/* Stats terminal bar */}
            <div
              className="flex items-center gap-5 py-2.5 px-4 rounded-lg border font-mono text-xs"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.12)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
              }}
            >
              <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>got_it</span>
                <span className="font-bold" style={{ color: "#22c55e" }}>{gotIt}</span>
              </div>
              <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>missed</span>
                <span className="font-bold" style={{ color: "#ef4444" }}>{missed}</span>
              </div>
              <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>remaining</span>
                <span className="font-bold text-foreground">{studyDeck.length}</span>
              </div>
            </div>
          </div>

          {/* ── Card ───────────────────────────────────── */}
          <div className="study-enter stagger-1 mb-4">
            <div
              className="rounded-2xl border overflow-hidden transition-all duration-200"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.2)`,
                opacity: animating ? 0 : 1,
                transform: animating ? "scale(0.97) translateY(4px)" : "scale(1) translateY(0)",
              }}
            >
              {/* Terminal chrome */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b font-mono text-[10px]"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.1)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400/40" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
                  <span className="w-2 h-2 rounded-full bg-green-400/40" />
                  <span className="ml-2" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    card.sh
                  </span>
                </div>
                {/* State badge */}
                <span
                  className="px-2 py-0.5 rounded font-mono text-[10px] tracking-widest border"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.2)`,
                    color: "var(--theme-badge-text)",
                    backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                  }}
                >
                  {cardStateLabel}
                </span>
              </div>

              {/* Card body */}
              <div
                className="p-8 min-h-[220px] flex flex-col items-center justify-center text-center gap-4"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
              >
                {cardState === "keyword" && (
                  <h2 className="text-4xl font-black tracking-tight">{currentCard.keyword}</h2>
                )}

                {cardState === "hint" && (
                  <>
                    <h2 className="text-2xl font-black" style={{ color: "var(--theme-primary)" }}>
                      {currentCard.keyword}
                    </h2>
                    <div className="w-8 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.3)` }} />
                    <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                      {currentCard.hint}
                    </p>
                  </>
                )}

                {cardState === "answer" && (
                  <>
                    <h2 className="text-2xl font-black" style={{ color: "var(--theme-primary)" }}>
                      {currentCard.keyword}
                    </h2>
                    <div className="w-8 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.3)` }} />
                    <p className="text-sm leading-relaxed text-foreground/80 max-w-sm font-mono">
                      {currentCard.explanation}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ────────────────────────────────── */}
          <div className="study-enter stagger-2">
            {cardState !== "answer" ? (
              <div className="flex gap-3">
                {cardState === "keyword" && (
                  <button
                    onClick={() => setCardState("hint")}
                    className="action-ghost flex-1 py-3 rounded-xl text-sm font-semibold border font-mono transition-all"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.2)`,
                      color: "var(--theme-badge-text)",
                      backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    }}
                  >
                    {t("study.show_hint")}
                  </button>
                )}
                <button
                  onClick={() => setCardState("answer")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                  style={{
                    background: "var(--theme-primary)",
                    color: "#fff",
                    textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                >
                  {t("study.show_ans")}
                </button>
              </div>
            ) : (
              <>
                <SectionRule label="// HOW DID YOU DO?" />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResult("missed")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{
                      borderColor: "rgb(239 68 68 / 0.35)",
                      backgroundColor: "rgb(239 68 68 / 0.06)",
                      color: "#ef4444",
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    {t("study.missed")}
                  </button>
                  <button
                    onClick={() => handleResult("unsure")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{
                      borderColor: "rgb(234 179 8 / 0.35)",
                      backgroundColor: "rgb(234 179 8 / 0.06)",
                      color: "#eab308",
                    }}
                  >
                    <Minus className="w-4 h-4" />
                    {t("study.unsure")}
                  </button>
                  <button
                    onClick={() => handleResult("got_it")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{
                      borderColor: "rgb(34 197 94 / 0.35)",
                      backgroundColor: "rgb(34 197 94 / 0.06)",
                      color: "#22c55e",
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t("study.got_it")}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

// ── Shared sub-components ──────────────────────────────────────

const NoiseAndBloom = () => (
  <>
    <div
      className="noise-bg"
      style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        opacity: 0.022,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px",
      }}
    />
    <div
      style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 240, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)",
      }}
    />
  </>
);

// ── Styles ──────────────────────────────────────────────────────

const studyStyles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .study-enter {
    opacity: 0;
    animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .stagger-1 { animation-delay: 60ms; }
  .stagger-2 { animation-delay: 120ms; }
  .action-ghost:hover {
    background-color: rgb(var(--theme-glow) / 0.1) !important;
    border-color: rgb(var(--theme-glow) / 0.35) !important;
  }
  .result-btn:hover { filter: brightness(1.15); }
`;

const completeStyles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .complete-enter {
    opacity: 0;
    animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .stagger-1 { animation-delay: 60ms; }
  .stagger-2 { animation-delay: 120ms; }
  .stagger-3 { animation-delay: 180ms; }
  .action-btn:hover {
    background-color: rgb(var(--theme-glow) / 0.1) !important;
    border-color: rgb(var(--theme-glow) / 0.35) !important;
  }
`;

// ── Page wrapper ────────────────────────────────────────────────

const StudyPage = () => (
  <Suspense>
    <StudyContent />
  </Suspense>
);

export default StudyPage;