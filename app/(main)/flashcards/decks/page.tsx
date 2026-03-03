"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  LayersIcon,
  BookOpen,
  Calendar,
  ArrowRight,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getDecks, deleteDeck, DBDeck } from "@/lib/db";

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div
      className="flex-1 h-px"
      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }}
    />
  </div>
);

const DeckCard = ({
  deck,
  index,
  onDelete,
  deletingId,
}: {
  deck: DBDeck;
  index: number;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isDeleting = deletingId === deck.id;
  const isOwn = !deck.source_public_deck_id;

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
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${isDeleting ? "opacity-0 scale-95 pointer-events-none" : ""}`}
      style={{
        borderColor: `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}
    >
      {/* Titlebar */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 border-b"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.08)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--theme-primary)", opacity: 0.7 }}
        />
        <span
          className="font-mono text-[9px] truncate flex-1"
          style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
        >
          {deck.title.toLowerCase().replace(/\s+/g, "_")}.deck
        </span>
        <div className="flex items-center gap-2">
          {/* Source badge for community decks */}
          {!isOwn && deck.source_creator_username && (
            <Link
              href={`/profile/${deck.source_creator_username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all hover:brightness-110"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                color: `rgb(var(--theme-glow) / 0.5)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
              }}
            >
              @{deck.source_creator_username}
            </Link>
          )}
          {isOwn && (
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                color: "var(--theme-primary)",
                border: `1px solid rgb(var(--theme-glow) / 0.12)`,
              }}
            >
              yours
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + meta */}
        <div>
          <p className="font-black text-base leading-tight">{deck.title}</p>
          <div
            className="flex items-center gap-3 font-mono text-[10px] mt-2"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
          >
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {deck.cards?.length ?? 0} {t("decks.cards")}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeAgo(deck.created_at)}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        {(deck.cards?.length ?? 0) > 0 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 font-mono text-[10px] transition-all w-fit"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--theme-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = `rgb(var(--theme-glow) / 0.4)`)}
          >
            <ChevronDown
              className="w-3 h-3 transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {expanded ? "// collapse" : "// show_cards"}
          </button>
        )}

        {/* Expanded keyword preview */}
        {expanded && (
          <div
            className="rounded-xl border overflow-hidden font-mono text-xs"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.1)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            {/* Stats row */}
            <div className="flex">
              <div className="flex-1 px-3 py-2 flex flex-col gap-0.5">
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// total_cards</span>
                <span className="font-bold text-foreground">{deck.cards?.length ?? 0}</span>
              </div>
              <div
                className="flex-1 px-3 py-2 flex flex-col gap-0.5"
                style={{ borderLeft: `1px solid rgb(var(--theme-glow) / 0.08)` }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// source</span>
                <span className="font-bold" style={{ color: "var(--theme-primary)" }}>
                  {isOwn ? "created" : "community"}
                </span>
              </div>
              <div
                className="flex-1 px-3 py-2 flex flex-col gap-0.5"
                style={{ borderLeft: `1px solid rgb(var(--theme-glow) / 0.08)` }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)`, fontSize: "9px" }}>// added</span>
                <span className="font-bold text-foreground">{timeAgo(deck.created_at)}</span>
              </div>
            </div>

            {/* Keyword list */}
            <div className="px-3 py-2.5 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
              <p className="text-[9px] mb-2" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                // keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {deck.cards?.slice(0, 8).map((card) => (
                  <span
                    key={card.id}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.15)`,
                      color: "var(--theme-badge-text)",
                      backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                    }}
                  >
                    {card.keyword}
                  </span>
                ))}
                {(deck.cards?.length ?? 0) > 8 && (
                  <span
                    className="text-[10px] px-2 py-0.5"
                    style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                  >
                    +{(deck.cards?.length ?? 0) - 8} more...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div
          className="flex gap-2 pt-3 border-t"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}
        >
          {/* Study */}
          <button
            onClick={() => router.push(`/flashcards/study?id=${deck.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all hover:brightness-110"
            style={{ background: "var(--theme-primary)", color: "#fff" }}
          >
            {t("decks.study")} <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Edit — only own decks */}
          {isOwn && (
            <button
              onClick={() => router.push(`/flashcards/decks/${deck.id}/edit`)}
              className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
              style={{
                border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                color: "var(--muted-foreground)",
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-primary)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
                style={{
                  border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                  color: "var(--muted-foreground)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                cancel
              </button>
              <button
                onClick={() => { setConfirming(false); onDelete(deck.id); }}
                className="px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all"
                style={{
                  backgroundColor: "rgb(239 68 68 / 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgb(239 68 68 / 0.3)",
                }}
              >
                confirm
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="px-3 py-2 rounded-xl text-xs font-mono transition-all"
              style={{
                border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                color: "var(--muted-foreground)",
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(239 68 68 / 0.4)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DecksPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [decks, setDecks] = useState<DBDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getDecks().then((data) => {
      setDecks(data);
      setLoadingDecks(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
    try {
      const saved = sessionStorage.getItem("retainly_added_decks");
      if (saved) sessionStorage.removeItem("retainly_added_decks");
    } catch {}
  };

  const totalCards = decks.reduce((a, d) => a + (d.cards?.length ?? 0), 0);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        .stagger-1  { animation-delay: 60ms; }
        .new-btn {
          background: var(--theme-primary);
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: filter 0.15s ease;
        }
        .new-btn:hover { filter: brightness(1.1); }
      `}</style>

      {/* Noise */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.022,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "128px 128px",
        }}
      />
      {/* Bloom */}
      <div
        style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 240, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24">

          {/* Header */}
          <div className="page-enter mb-12">
            <div
              className="flex items-center gap-2 font-mono text-[11px] mb-7"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <LayersIcon className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/flashcards/decks</span>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
                {t("decks.title")}
              </h1>
              <button
                onClick={() => router.push("/flashcards")}
                className="new-btn flex items-center gap-2 px-4 py-2.5 rounded-[3px] text-sm font-mono shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("decks.new")}</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>

            {!loadingDecks && decks.length > 0 && (
              <div
                className="flex items-center gap-5 font-mono text-xs py-2.5 px-4 rounded-lg border w-fit"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.12)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
                }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>decks</span>
                  <span className="font-bold text-foreground">{decks.length}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <div className="flex items-center gap-1.5">
                  <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>cards</span>
                  <span className="font-bold text-foreground">{totalCards}</span>
                </div>
                <div className="h-3 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">ready</span>
                </span>
              </div>
            )}
          </div>

          {/* Skeleton */}
          {loadingDecks && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border animate-pulse h-48"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.1)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingDecks && decks.length === 0 && (
            <div className="page-enter stagger-1 text-center py-16">
              <div className="font-mono text-xs mb-6" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la decks/
                <br />
                <span className="mt-2 block">{t("decks.empty")}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{t("decks.empty_sub")}</p>
              <button
                onClick={() => router.push("/flashcards")}
                className="new-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-[3px] text-sm font-mono"
              >
                <Plus className="w-4 h-4" />
                {t("decks.create")}
              </button>
            </div>
          )}

          {/* Deck grid */}
          {!loadingDecks && decks.length > 0 && (
            <div className="page-enter stagger-1">
              <SectionRule label={`// ${decks.length} DECK${decks.length !== 1 ? "S" : ""}`} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {decks.map((deck, i) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    index={i}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                ))}
              </div>

              {/* Add more */}
              <button
                onClick={() => router.push("/flashcards")}
                className="w-full mt-4 py-3 rounded-[3px] border border-dashed font-mono text-xs transition-all duration-150"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.15)`,
                  color: `rgb(var(--theme-glow) / 0.4)`,
                }}
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
                + {t("decks.new")}
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

export default DecksPage;