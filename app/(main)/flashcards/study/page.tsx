"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useGems } from "@/hooks/useGems";
import { Suspense } from "react";
import { CheckCircle, XCircle, Minus, LayersIcon } from "lucide-react";

import { getDeck, DBDeck, DBCard } from "@/lib/db";

type CardState = "keyword" | "hint" | "answer";
type CardResult = "got_it" | "unsure" | "missed";
type PageState = "study" | "complete";

const gradientBtn: React.CSSProperties = {
  background: "var(--theme-gradient)",
  color: "#fff",
  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
};

const StudyContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("id");
  const { t } = useLanguage();
  const { addGems } = useGems();

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
        // Award gems — 5 per Got it
        const earned = (gotIt + 1) * 5;
        await addGems(earned);
        setGemsEarned(earned);
        setPageState("complete");
        return;
      }

      setStudyDeck(remaining);
      setCardState("keyword");
      setAnimating(false);
    }, 200);
  };

  const progress = deck ? (gotIt / (gotIt + studyDeck.length)) * 100 : 0;

  if (loadingDeck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--theme-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Deck not found.</p>
      </div>
    );
  }

  // ─── COMPLETE PAGE ────────────────────────────────────────────
  if (pageState === "complete") {
    const total = gotIt + missed + unsure;
    const scorePercent = Math.round((gotIt / total) * 100);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background text-foreground">
        <div className="w-full max-w-xl space-y-6 text-center">
          <div className="text-6xl">🎉</div>

          <div>
            <h1 className="text-4xl font-black mb-1">{t("study.complete")}</h1>
            <p className="text-muted-foreground text-sm">{deck.title}</p>
          </div>

          {/* Score ring */}
          <div
            className="mx-auto w-28 h-28 rounded-full flex items-center justify-center border-4"
            style={{
              borderColor: "var(--theme-primary)",
              background: `rgb(var(--theme-glow) / 0.08)`,
            }}
          >
            <span
              className="text-3xl font-black bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--theme-gradient)" }}
            >
              {scorePercent}%
            </span>
          </div>

          {/* Counters */}
          <div className="flex justify-center gap-4">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "rgb(34 197 94 / 0.1)",
                color: "#22c55e",
              }}
            >
              <CheckCircle className="w-4 h-4" /> {gotIt} {t("study.got_it")}
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "rgb(234 179 8 / 0.1)",
                color: "#eab308",
              }}
            >
              <Minus className="w-4 h-4" /> {unsure} {t("study.unsure")}
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "rgb(239 68 68 / 0.1)",
                color: "#ef4444",
              }}
            >
              <XCircle className="w-4 h-4" /> {missed} {t("study.missed")}
            </div>
          </div>

          {/* Gems earned */}
          {gemsEarned > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--theme-badge-text)",
                border: `1px solid rgb(var(--theme-glow) / 0.3)`,
              }}
            >
              💎 +{gemsEarned} {t("study.gems_earned")}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/flashcards/decks")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.3)`,
                color: "var(--theme-badge-text)",
                backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
              }}
            >
              {t("study.view_decks")}
            </button>
            <button
              onClick={() => router.push("/flashcards")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
              style={gradientBtn}
            >
              {t("study.new_flash")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = studyDeck[0];

  // ─── STUDY PAGE ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background text-foreground">
      <div className="w-full max-w-xl space-y-5">
        {/* Deck title */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LayersIcon
            className="w-4 h-4"
            style={{ color: "var(--theme-primary)" }}
          />
          <span className="font-medium">{deck.title}</span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "var(--theme-gradient)",
            }}
          />
        </div>

        {/* Score counters */}
        <div className="flex justify-between text-xs font-semibold">
          <span
            className="flex items-center gap-1"
            style={{ color: "#22c55e" }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> {gotIt} {t("study.got_it")}
          </span>
          <span className="text-muted-foreground">
            {studyDeck.length} {t("study.remaining")}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ color: "#ef4444" }}
          >
            {missed} {t("study.missed")} <XCircle className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 min-h-[260px] flex flex-col items-center justify-center text-center space-y-4 border transition-all duration-200"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.2)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
            opacity: animating ? 0 : 1,
            transform: animating ? "scale(0.97)" : "scale(1)",
          }}
        >
          {/* State label */}
          <span
            className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.25)`,
              color: "var(--theme-badge-text)",
              backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
            }}
          >
            {cardState === "keyword"
              ? t("study.keyword")
              : cardState === "hint"
                ? t("study.hint")
                : t("study.answer")}
          </span>

          {cardState === "keyword" && (
            <h2 className="text-4xl font-black">{currentCard.keyword}</h2>
          )}

          {cardState === "hint" && (
            <>
              <h2
                className="text-2xl font-black bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--theme-gradient)" }}
              >
                {currentCard.keyword}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                {currentCard.hint}
              </p>
            </>
          )}

          {cardState === "answer" && (
            <>
              <h2
                className="text-2xl font-black bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--theme-gradient)" }}
              >
                {currentCard.keyword}
              </h2>
              <div
                className="w-12 h-px"
                style={{ background: `rgb(var(--theme-glow) / 0.4)` }}
              />
              <p className="text-sm leading-relaxed text-foreground/80 max-w-sm">
                {currentCard.explanation}
              </p>
            </>
          )}
        </div>

        {/* Hint / Answer buttons */}
        {cardState !== "answer" && (
          <div className="flex gap-3">
            {cardState === "keyword" && (
              <button
                onClick={() => setCardState("hint")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.25)`,
                  color: "var(--theme-badge-text)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    `rgb(var(--theme-glow) / 0.12)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    `rgb(var(--theme-glow) / 0.06)`;
                }}
              >
                {t("study.show_hint")}
              </button>
            )}
            <button
              onClick={() => setCardState("answer")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
              style={gradientBtn}
            >
              {t("study.show_ans")}
            </button>
          </div>
        )}

        {/* Got it / Unsure / Missed */}
        {cardState === "answer" && (
          <div className="flex gap-3">
            <button
              onClick={() => handleResult("missed")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: "rgb(239 68 68 / 0.4)",
                backgroundColor: "rgb(239 68 68 / 0.06)",
                color: "#ef4444",
              }}
            >
              {t("study.missed")}
            </button>
            <button
              onClick={() => handleResult("unsure")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: "rgb(234 179 8 / 0.4)",
                backgroundColor: "rgb(234 179 8 / 0.06)",
                color: "#eab308",
              }}
            >
              {t("study.unsure")}
            </button>
            <button
              onClick={() => handleResult("got_it")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: "rgb(34 197 94 / 0.4)",
                backgroundColor: "rgb(34 197 94 / 0.06)",
                color: "#22c55e",
              }}
            >
              {t("study.got_it")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StudyPage = () => (
  <Suspense>
    <StudyContent />
  </Suspense>
);

export default StudyPage;