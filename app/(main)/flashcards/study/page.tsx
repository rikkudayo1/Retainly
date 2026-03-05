"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useGemsContext } from "@/context/GemsContext";
import { Suspense } from "react";
import { CheckCircle, XCircle, Minus, LayersIcon, Sparkles, Zap, Trophy, Star, TrendingUp, Plus } from "lucide-react";
import { getDeck, DBDeck, DBCard, logActivity } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────

type CardState = "keyword" | "hint" | "answer";
type CardResult = "got_it" | "unsure" | "missed";
type PageState = "study" | "complete";
type Mastery = "unknown" | "weak" | "shaky" | "mastered";

interface CardRecord {
  card: DBCard;
  result: CardResult;
  timeMs: number;
}

interface MasteryEntry {
  cardId: string;
  keyword: string;
  mastery: Mastery;
}

const LEVELS = [
  { name: "Novice",    xpRequired: 0    },
  { name: "Apprentice",xpRequired: 100  },
  { name: "Scholar",   xpRequired: 250  },
  { name: "Adept",     xpRequired: 500  },
  { name: "Expert",    xpRequired: 850  },
  { name: "Sage",      xpRequired: 1300 },
  { name: "Archivist", xpRequired: 2000 },
  { name: "Master",    xpRequired: 3000 },
];

function getLevelInfo(xp: number) {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) { level = i; break; }
  }
  const current = LEVELS[level];
  const next = LEVELS[level + 1];
  const progressXp = xp - current.xpRequired;
  const rangeXp = next ? next.xpRequired - current.xpRequired : 1;
  return { level, name: current.name, progressXp, rangeXp, xp };
}

const MASTERY_COLOR: Record<Mastery, string> = {
  unknown:  "rgb(var(--theme-glow) / 0.15)",
  weak:     "#ef4444",
  shaky:    "#eab308",
  mastered: "#22c55e",
};

const MASTERY_LABEL: Record<Mastery, string> = {
  unknown:  "?",
  weak:     "✗",
  shaky:    "~",
  mastered: "✓",
};

// XP awards
const XP_GOT_IT  = 30;
const XP_UNSURE  = 8;
const XP_MISSED  = 0;

// Combo thresholds → multiplier
function getCombo(streak: number): { mult: number; label: string } {
  if (streak >= 7) return { mult: 3,   label: "🔥 INFERNO ×3" };
  if (streak >= 5) return { mult: 2.5, label: "⚡ BLAZING ×2.5" };
  if (streak >= 3) return { mult: 2,   label: "✨ COMBO ×2" };
  if (streak >= 2) return { mult: 1.5, label: "💫 STREAK ×1.5" };
  return { mult: 1, label: "" };
}

// ── Particles burst ──────────────────────────────────────────────

const Burst = ({ active, color }: { active: boolean; color: string }) => {
  if (!active) return null;
  return (
    <div className="burst-container" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="burst-dot"
          style={{
            "--angle": `${i * 30}deg`,
            "--color": color,
            animationDelay: `${i * 12}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// ── Floating XP label ────────────────────────────────────────────

const FloatXP = ({ xp }: { xp: number }) => (
  <div className="float-xp" aria-hidden>
    +{xp} XP
  </div>
);

// ── Section rule ─────────────────────────────────────────────────

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-5">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

// ── XP Bar ───────────────────────────────────────────────────────

const XPBar = ({
  xp, prevXp, leveledUp, levelName,
}: { xp: number; prevXp: number; leveledUp: boolean; levelName: string }) => {
  const info = getLevelInfo(xp);
  const pct = Math.min(100, (info.progressXp / info.rangeXp) * 100);

  return (
    <div className="xp-bar-wrap" style={{ position: "relative" }}>
      {leveledUp && (
        <div className="level-up-flash">
          <Star className="w-3.5 h-3.5" /> LEVEL UP — {levelName}!
        </div>
      )}
      <div className="flex items-center justify-between mb-1 font-mono text-[10px]"
        style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
          {info.name}
        </span>
        <span>{xp} XP</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
        <div
          className="h-full rounded-full xp-fill"
          style={{ width: `${pct}%`, background: "var(--theme-primary)" }}
        />
      </div>
    </div>
  );
};

// ── Streak Badge ─────────────────────────────────────────────────

const StreakBadge = ({ streak }: { streak: number }) => {
  const { mult, label } = getCombo(streak);
  if (streak === 0) return null;
  return (
    <div className={`streak-badge ${streak >= 3 ? "streak-hot" : ""}`}>
      <Zap className="w-3 h-3" />
      <span>{streak}</span>
      {label && <span className="streak-label">{label}</span>}
    </div>
  );
};

// ── Mastery Map ───────────────────────────────────────────────────

const MasteryMap = ({ entries }: { entries: MasteryEntry[] }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div>
      <SectionRule label="// CARD MASTERY MAP" />
      <div className="mastery-grid">
        {entries.map((e) => (
          <div
            key={e.cardId}
            className="mastery-dot"
            style={{ backgroundColor: MASTERY_COLOR[e.mastery] }}
            onMouseEnter={() => setHovered(e.cardId)}
            onMouseLeave={() => setHovered(null)}
            title={`${e.keyword} — ${e.mastery}`}
          >
            {hovered === e.cardId && (
              <div className="mastery-tooltip">{e.keyword}<br /><span style={{ color: MASTERY_COLOR[e.mastery] }}>{e.mastery}</span></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Timeline Chart ───────────────────────────────────────────────

const Timeline = ({ records }: { records: CardRecord[] }) => {
  if (records.length === 0) return null;
  return (
    <div>
      <SectionRule label="// SESSION TIMELINE" />
      <div className="timeline-row">
        {records.map((r, i) => (
          <div
            key={i}
            className="timeline-dot"
            style={{
              backgroundColor:
                r.result === "got_it" ? "#22c55e"
                : r.result === "unsure" ? "#eab308"
                : "#ef4444",
            }}
            title={`${r.card.keyword} — ${r.result}`}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[9px] mt-1"
        style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
        <span>start</span>
        <span>{records.length} cards</span>
        <span>finish</span>
      </div>
    </div>
  );
};

// ── Main StudyContent ────────────────────────────────────────────

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

  // Gamification state
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [prevXp, setPrevXp] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [burstColor, setBurstColor] = useState("#22c55e");
  const [floatXpKey, setFloatXpKey] = useState(0);
  const [floatXpVal, setFloatXpVal] = useState(0);
  const [showFloat, setShowFloat] = useState(false);
  const [records, setRecords] = useState<CardRecord[]>([]);
  const [masteryMap, setMasteryMap] = useState<Map<string, MasteryEntry>>(new Map());
  const cardStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!deckId) return;
    getDeck(deckId).then((found) => {
      if (found) {
        setDeck(found);
        const cards = [...(found.cards ?? [])];
        setStudyDeck(cards);
        // Init mastery map
        const m = new Map<string, MasteryEntry>();
        cards.forEach((c) => m.set(c.id, { cardId: c.id, keyword: c.keyword, mastery: "unknown" }));
        setMasteryMap(m);
      }
      setLoadingDeck(false);
    });
  }, [deckId]);

  // Reset timer when card changes
  useEffect(() => { cardStartTime.current = Date.now(); }, [studyDeck[0]?.id, cardState]);

  const triggerBurst = (color: string) => {
    setBurstColor(color);
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 600);
  };

  const triggerFloatXP = (val: number) => {
    setFloatXpVal(val);
    setFloatXpKey((k) => k + 1);
    setShowFloat(true);
    setTimeout(() => setShowFloat(false), 1000);
  };

  const handleResult = (result: CardResult) => {
    setAnimating(true);
    const elapsed = Date.now() - cardStartTime.current;
    const currentCard = studyDeck[0];

    // Compute XP with combo
    const { mult } = getCombo(result === "got_it" ? streak + 1 : streak);
    const baseXp = result === "got_it" ? XP_GOT_IT : result === "unsure" ? XP_UNSURE : XP_MISSED;
    const earnedXp = Math.round(baseXp * mult);

    // Streak
    const newStreak = result === "got_it" ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    // XP & level-up
    if (earnedXp > 0) {
      const prevLevel = getLevelInfo(xp).level;
      const newXp = xp + earnedXp;
      const newLevel = getLevelInfo(newXp).level;
      setPrevXp(xp);
      setXp(newXp);
      if (newLevel > prevLevel) {
        setLeveledUp(true);
        setTimeout(() => setLeveledUp(false), 2500);
      }
      triggerFloatXP(earnedXp);
    }

    // Burst
    if (result === "got_it") triggerBurst("#22c55e");
    else if (result === "unsure") triggerBurst("#eab308");
    else triggerBurst("#ef4444");

    // Mastery update
    const masteryResult: Mastery =
      result === "got_it" ? "mastered" : result === "unsure" ? "shaky" : "weak";
    setMasteryMap((prev) => {
      const next = new Map(prev);
      next.set(currentCard.id, { cardId: currentCard.id, keyword: currentCard.keyword, mastery: masteryResult });
      return next;
    });

    // Record
    setRecords((prev) => [...prev, { card: currentCard, result, timeMs: elapsed }]);

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
  const accuracy = total > 0 ? Math.round((gotIt / total) * 100) : 0;
  const levelInfo = getLevelInfo(xp);

  // ── Loading ──────────────────────────────────────────────────
  if (loadingDeck) {
    return (
      <>
        <NoiseAndBloom />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="space-y-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
            <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>loading deck...</p>
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
          <div className="font-mono text-xs px-4 py-3 rounded-xl border"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.5)` }}>
            <span style={{ color: "var(--theme-primary)" }}>!</span> deck not found
          </div>
        </div>
      </>
    );
  }

  // ── Complete ──────────────────────────────────────────────────
  if (pageState === "complete") {
    const scorePercent = total > 0 ? Math.round((gotIt / total) * 100) : 0;
    const scoreColor = scorePercent >= 80 ? "#22c55e" : scorePercent >= 50 ? "#eab308" : "#ef4444";
    const masteryEntries = Array.from(masteryMap.values());
    const masteredCount = masteryEntries.filter((e) => e.mastery === "mastered").length;
    const weakCards = masteryEntries.filter((e) => e.mastery === "weak" || e.mastery === "shaky");

    return (
      <>
        <style>{allStyles}</style>
        <NoiseAndBloom />
        <div className="relative z-10 min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">

            {/* Header */}
            <div className="complete-enter mb-8 text-center">
              <div className="flex items-center justify-center gap-2 font-mono text-[11px] mb-7"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <Trophy className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
                <span>~/retainly/flashcards/complete</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
                {t("study.complete")}
              </h1>
              <p className="text-muted-foreground text-sm font-mono">{deck.title}</p>
            </div>

            {/* Score + Stats */}
            <div className="complete-enter stagger-1 rounded-2xl border p-6 mb-4 flex items-center gap-6"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.18)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 shrink-0"
                style={{ borderColor: scoreColor, backgroundColor: `${scoreColor}10` }}>
                <span className="text-2xl font-black" style={{ color: scoreColor }}>{scorePercent}%</span>
              </div>
              <div className="flex-1 space-y-2 font-mono text-xs">
                {[
                  { label: "got_it",  val: gotIt,  color: "#22c55e" },
                  { label: "unsure",  val: unsure, color: "#eab308" },
                  { label: "missed",  val: missed, color: "#ef4444" },
                  { label: "total",   val: total,  color: "var(--theme-badge-text)" },
                ].map(({ label, val, color }, i) => (
                  <div key={label}>
                    {i > 0 && <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />}
                    <div className="flex items-center justify-between">
                      <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>{label}</span>
                      <span className="font-bold" style={{ color }}>{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* XP + Level summary */}
            <div className="complete-enter stagger-1 rounded-2xl border p-5 mb-4 font-mono text-xs space-y-3"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.18)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <div className="flex items-center justify-between">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>final_xp</span>
                <span className="font-bold text-foreground">{xp} XP</span>
              </div>
              <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
              <div className="flex items-center justify-between">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>level</span>
                <span className="font-bold" style={{ color: "var(--theme-primary)" }}>{levelInfo.name}</span>
              </div>
              <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
              <div className="flex items-center justify-between">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>best_streak</span>
                <span className="font-bold" style={{ color: "#f97316" }}>{bestStreak} 🔥</span>
              </div>
              <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
              <div className="flex items-center justify-between">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>mastered</span>
                <span className="font-bold" style={{ color: "#22c55e" }}>{masteredCount}/{masteryEntries.length}</span>
              </div>
            </div>

            {/* Mastery Map */}
            <div className="complete-enter stagger-2 rounded-2xl border p-5 mb-4"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.18)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <MasteryMap entries={Array.from(masteryMap.values())} />
              {weakCards.length > 0 && (
                <div className="mt-4">
                  <SectionRule label="// NEEDS REVIEW" />
                  <div className="flex flex-wrap gap-2">
                    {weakCards.slice(0, 6).map((e) => (
                      <span key={e.cardId}
                        className="font-mono text-[10px] px-2 py-1 rounded border"
                        style={{
                          borderColor: MASTERY_COLOR[e.mastery],
                          color: MASTERY_COLOR[e.mastery],
                          backgroundColor: `${MASTERY_COLOR[e.mastery]}18`,
                        }}>
                        {e.keyword}
                      </span>
                    ))}
                    {weakCards.length > 6 && (
                      <span className="font-mono text-[10px] px-2 py-1 rounded border"
                        style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.4)` }}>
                        +{weakCards.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="complete-enter stagger-2 rounded-2xl border p-5 mb-4"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.18)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
              <Timeline records={records} />
            </div>

            {/* Gems */}
            {gemsEarned > 0 && (
              <div className="complete-enter stagger-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border mb-6 font-mono text-sm"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                <span>💎</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>earned</span>
                <span className="font-bold" style={{ color: "var(--theme-badge-text)" }}>+{gemsEarned}</span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>{t("study.gems_earned")}</span>
              </div>
            )}

            {/* Actions */}
            <div className="complete-enter stagger-3 flex gap-3">
              <button
                onClick={() => router.push("/flashcards/decks")}
                className="action-btn flex-1 py-3 rounded-xl text-sm font-semibold border font-mono transition-all"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--theme-badge-text)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                {t("study.view_decks")}
              </button>
              <button
                onClick={() => router.push("/flashcards")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: "var(--theme-primary)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <Plus className="w-4 h-4" />
                {t("study.new_flash")}
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
              <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>RETAINLY</span>
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            </div>

          </div>
        </div>
      </>
    );
  }

  // ── Study ────────────────────────────────────────────────────
  const currentCard = studyDeck[0];
  const { mult, label: comboLabel } = getCombo(streak);
  const cardStateLabel =
    cardState === "keyword" ? t("study.keyword")
    : cardState === "hint" ? t("study.hint")
    : t("study.answer");

  return (
    <>
      <style>{allStyles}</style>
      <NoiseAndBloom />

      {/* Burst overlay */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, pointerEvents: "none" }}>
        <Burst active={burstActive} color={burstColor} />
        {showFloat && <FloatXP xp={floatXpVal} key={floatXpKey} />}
      </div>

      <div className="relative z-10 min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="w-full max-w-xl">

          {/* ── Header ──────────────────────────────── */}
          <div className="study-enter mb-6">
            <div className="flex items-center gap-2 font-mono text-[11px] mb-4"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <LayersIcon className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/flashcards/study</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span className="truncate max-w-[160px]">{deck.title}</span>
            </div>

            {/* XP Bar */}
            <div className="mb-3">
              <XPBar xp={xp} prevXp={prevXp} leveledUp={leveledUp} levelName={levelInfo.name} />
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full overflow-hidden mb-3"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: "var(--theme-primary)" }} />
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 py-2.5 px-4 rounded-lg border font-mono text-xs"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.025)` }}>
              <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>got_it</span>
                <span className="font-bold" style={{ color: "#22c55e" }}>{gotIt}</span>
              </div>
              <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>acc</span>
                <span className="font-bold" style={{ color: accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#eab308" : "#ef4444" }}>
                  {accuracy}%
                </span>
              </div>
              <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-1.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>rem</span>
                <span className="font-bold text-foreground">{studyDeck.length}</span>
              </div>
              <div className="ml-auto">
                <StreakBadge streak={streak} />
              </div>
            </div>
          </div>

          {/* ── Card ──────────────────────────────── */}
          <div className="study-enter stagger-1 mb-4">
            {/* Combo label above card */}
            {comboLabel && (
              <div className="combo-banner mb-2">{comboLabel}</div>
            )}
            <div className="rounded-2xl border overflow-hidden transition-all duration-200"
              style={{
                borderColor: streak >= 3 ? `rgba(249,115,22,0.4)` : `rgb(var(--theme-glow) / 0.2)`,
                boxShadow: streak >= 3 ? `0 0 24px rgba(249,115,22,0.12)` : "none",
                opacity: animating ? 0 : 1,
                transform: animating ? "scale(0.97) translateY(4px)" : "scale(1) translateY(0)",
              }}>
              {/* Chrome */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b font-mono text-[10px]"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400/40" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
                  <span className="w-2 h-2 rounded-full bg-green-400/40" />
                  <span className="ml-2" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>card.sh</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-widest border"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--theme-badge-text)", backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}>
                  {cardStateLabel}
                </span>
              </div>

              {/* Body */}
              <div className="p-8 min-h-[220px] flex flex-col items-center justify-center text-center gap-4"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                {cardState === "keyword" && (
                  <h2 className="text-4xl font-black tracking-tight">{currentCard.keyword}</h2>
                )}
                {cardState === "hint" && (
                  <>
                    <h2 className="text-2xl font-black" style={{ color: "var(--theme-primary)" }}>{currentCard.keyword}</h2>
                    <div className="w-8 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.3)` }} />
                    <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">{currentCard.hint}</p>
                  </>
                )}
                {cardState === "answer" && (
                  <>
                    <h2 className="text-2xl font-black" style={{ color: "var(--theme-primary)" }}>{currentCard.keyword}</h2>
                    <div className="w-8 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.3)` }} />
                    <p className="text-sm leading-relaxed text-foreground/80 max-w-sm font-mono">{currentCard.explanation}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ───────────────────────────── */}
          <div className="study-enter stagger-2">
            {cardState !== "answer" ? (
              <div className="flex gap-3">
                {cardState === "keyword" && (
                  <button
                    onClick={() => setCardState("hint")}
                    className="action-ghost flex-1 py-3 rounded-xl text-sm font-semibold border font-mono transition-all"
                    style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: "var(--theme-badge-text)", backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                    {t("study.show_hint")}
                  </button>
                )}
                <button
                  onClick={() => setCardState("answer")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                  style={{ background: "var(--theme-primary)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                  {t("study.show_ans")}
                </button>
              </div>
            ) : (
              <>
                <SectionRule label="// HOW DID YOU DO?" />
                {/* XP preview labels */}
                <div className="flex gap-3 mb-1.5 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                  <div className="flex-1 text-center">+{Math.round(XP_MISSED * mult)} xp</div>
                  <div className="flex-1 text-center">+{Math.round(XP_UNSURE * mult)} xp</div>
                  <div className="flex-1 text-center">+{Math.round(XP_GOT_IT * mult)} xp</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResult("missed")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{ borderColor: "rgb(239 68 68 / 0.35)", backgroundColor: "rgb(239 68 68 / 0.06)", color: "#ef4444" }}>
                    <XCircle className="w-4 h-4" />
                    {t("study.missed")}
                  </button>
                  <button
                    onClick={() => handleResult("unsure")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{ borderColor: "rgb(234 179 8 / 0.35)", backgroundColor: "rgb(234 179 8 / 0.06)", color: "#eab308" }}>
                    <Minus className="w-4 h-4" />
                    {t("study.unsure")}
                  </button>
                  <button
                    onClick={() => handleResult("got_it")}
                    className="result-btn flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5"
                    style={{ borderColor: "rgb(34 197 94 / 0.35)", backgroundColor: "rgb(34 197 94 / 0.06)", color: "#22c55e" }}>
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

// ── Shared sub-components ────────────────────────────────────────

const NoiseAndBloom = () => (
  <>
    <div className="noise-bg" style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.022,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "128px 128px",
    }} />
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: 600, height: 240, pointerEvents: "none", zIndex: 0,
      background: "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)",
    }} />
  </>
);

// ── Styles ───────────────────────────────────────────────────────

const allStyles = `
  /* ── Base animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .study-enter, .complete-enter {
    opacity: 0;
    animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .stagger-1 { animation-delay: 60ms; }
  .stagger-2 { animation-delay: 120ms; }
  .stagger-3 { animation-delay: 180ms; }

  /* ── Button hovers ── */
  .action-ghost:hover { background-color: rgb(var(--theme-glow) / 0.1) !important; border-color: rgb(var(--theme-glow) / 0.35) !important; }
  .result-btn:hover   { filter: brightness(1.15); }
  .action-btn:hover   { background-color: rgb(var(--theme-glow) / 0.1) !important; border-color: rgb(var(--theme-glow) / 0.35) !important; }

  /* ── XP bar fill ── */
  @keyframes xpFill {
    from { width: 0%; }
  }
  .xp-fill { transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }

  /* ── Level up flash ── */
  @keyframes levelUpPop {
    0%   { opacity: 0; transform: translateY(6px) scale(0.9); }
    15%  { opacity: 1; transform: translateY(0) scale(1.05); }
    80%  { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-6px) scale(0.95); }
  }
  .level-up-flash {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--theme-primary);
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: 99px;
    border: 1px solid rgb(var(--theme-glow) / 0.3);
    background: rgb(var(--theme-glow) / 0.08);
    backdrop-filter: blur(4px);
    animation: levelUpPop 2.4s ease forwards;
    pointer-events: none;
  }

  /* ── Streak badge ── */
  .streak-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    border: 1px solid rgb(249 115 22 / 0.35);
    color: #f97316;
    background: rgb(249 115 22 / 0.08);
    transition: all 0.2s;
  }
  @keyframes streakPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgb(249 115 22 / 0.4); }
    50%       { box-shadow: 0 0 0 6px rgb(249 115 22 / 0); }
  }
  .streak-hot { animation: streakPulse 1.2s ease infinite; }
  .streak-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #fb923c;
    margin-left: 2px;
  }

  /* ── Combo banner ── */
  @keyframes comboPop {
    0%   { opacity: 0; transform: scale(0.8); }
    40%  { opacity: 1; transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  .combo-banner {
    text-align: center;
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #fb923c;
    animation: comboPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Float XP ── */
  @keyframes floatXP {
    0%   { opacity: 0; transform: translateY(0) scale(0.8); }
    20%  { opacity: 1; transform: translateY(-10px) scale(1.1); }
    100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
  }
  .float-xp {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    font-family: monospace;
    font-size: 15px;
    font-weight: 900;
    color: #22c55e;
    pointer-events: none;
    animation: floatXP 0.9s ease forwards;
    white-space: nowrap;
    text-shadow: 0 0 12px rgb(34 197 94 / 0.6);
  }

  /* ── Particle burst ── */
  @keyframes burst {
    0%   { opacity: 1; transform: rotate(var(--angle)) translateX(0) scale(1); }
    100% { opacity: 0; transform: rotate(var(--angle)) translateX(40px) scale(0.3); }
  }
  .burst-container { position: relative; width: 0; height: 0; }
  .burst-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color);
    top: -3px;
    left: -3px;
    animation: burst 0.5s ease-out forwards;
    box-shadow: 0 0 4px var(--color);
  }

  /* ── Mastery map ── */
  .mastery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mastery-dot {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    cursor: default;
    position: relative;
    transition: transform 0.15s;
    flex-shrink: 0;
  }
  .mastery-dot:hover { transform: scale(1.3); z-index: 10; }
  .mastery-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #111;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 8px;
    padding: 6px 10px;
    font-family: monospace;
    font-size: 10px;
    white-space: nowrap;
    color: #eee;
    pointer-events: none;
    z-index: 20;
    line-height: 1.6;
  }

  /* ── Timeline ── */
  .timeline-row {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  .timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.1s;
  }
  .timeline-dot:hover { transform: scale(1.5); }
`;

// ── Page wrapper ─────────────────────────────────────────────────

const StudyPage = () => (
  <Suspense>
    <StudyContent />
  </Suspense>
);

export default StudyPage;