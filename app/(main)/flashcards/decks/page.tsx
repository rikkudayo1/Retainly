"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, LayersIcon, BookOpen, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

import { getDecks, deleteDeck, DBDeck } from "@/lib/db";

const DecksPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [decks, setDecks] = useState<DBDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);

  useEffect(() => {
    getDecks().then((data) => {
      setDecks(data);
      setLoadingDecks(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));

    // ADD: remove from added cache if this was an added public deck
    try {
      const saved = sessionStorage.getItem("retainly_added_decks");
      if (saved) {
        // We don't have the public_deck_id here so just clear the whole cache
        sessionStorage.removeItem("retainly_added_decks");
      }
    } catch {}
  };

  const totalCards = decks.reduce((a, d) => a + (d.cards?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black mb-1">{t("decks.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {decks.length > 0
              ? `${decks.length} ${t("nav.decks")} · ${totalCards} ${t("decks.total")}`
              : t("decks.empty")}
          </p>
          <div
            className="mt-3 h-px w-12"
            style={{ background: "var(--theme-primary)" }}
          />
        </div>
        <button
          onClick={() => router.push("/flashcards")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
          style={{
            background: "var(--theme-primary)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            borderColor: "transparent",
          }}
        >
          <Plus className="w-4 h-4" />
          {t("decks.new")}
        </button>
      </div>

      {/* Empty state */}
      {loadingDecks ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 animate-pulse"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.1)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              <div className="flex items-center gap-4 pl-10">
                <div
                  className="h-4 rounded-full w-1/3"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <LayersIcon
              className="w-8 h-8"
              style={{ color: "var(--theme-primary)" }}
            />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              {t("decks.empty")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("decks.empty_sub")}
            </p>
          </div>
          <button
            onClick={() => router.push("/flashcards")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
            style={{
              background: "var(--theme-primary)",
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            {t("decks.create")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck, i) => (
            <div
              key={deck.id}
              className="group relative rounded-2xl border p-5 transition-all duration-200"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  `rgb(var(--theme-glow) / 0.35)`;
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  `rgb(var(--theme-glow) / 0.07)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  `rgb(var(--theme-glow) / 0.15)`;
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  `rgb(var(--theme-glow) / 0.03)`;
              }}
            >
              {/* Deck number accent */}
              <div
                className="absolute top-5 left-5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{
                  background: `rgb(var(--theme-glow) / 0.12)`,
                  color: "var(--theme-badge-text)",
                }}
              >
                {i + 1}
              </div>

              <div className="flex items-center justify-between pl-10">
                <div className="space-y-2 flex-1 min-w-0 mr-4">
                  <div className="flex flex-col gap-2 mb-2">
                  <p className="font-bold text-base truncate">{deck.title}</p>
                  {deck.source_public_deck_id &&
                    deck.source_creator_username && (
                      <Link
                        href={`/profile/${deck.source_creator_username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border w-fit transition-all hover:brightness-110"
                        style={{
                          borderColor: `rgb(var(--theme-glow) / 0.2)`,
                          color: "var(--theme-badge-text)",
                          backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                        }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full overflow-hidden flex items-center justify-center text-[8px] font-black shrink-0"
                          style={{
                            backgroundColor: `rgb(var(--theme-glow) / 0.15)`,
                            color: "var(--theme-primary)",
                          }}
                        >
                          {deck.source_creator_avatar ? (
                            <img
                              src={deck.source_creator_avatar}
                              alt={deck.source_creator_username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            deck.source_creator_username[0].toUpperCase()
                          )}
                        </div>
                        {deck.source_creator_username}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {deck.cards?.length ?? 0} {t("decks.cards")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(deck.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Card preview pills */}
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {deck.cards?.slice(0, 4).map((card) => (
                      <span
                        key={card.id}
                        className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          borderColor: `rgb(var(--theme-glow) / 0.2)`,
                          color: "var(--theme-badge-text)",
                          backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                        }}
                      >
                        {card.keyword}
                      </span>
                    ))}
                    {(deck.cards?.length ?? 0) > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground">
                        +{(deck.cards?.length ?? 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      router.push(`/flashcards/study?id=${deck.id}`)
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
                    style={{
                      background: "var(--theme-primary)",
                      color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  >
                    {t("decks.study")}
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="p-2 rounded-xl transition-all opacity-100 group-hover:opacity-100 hover:bg-red-500/10 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecksPage;
