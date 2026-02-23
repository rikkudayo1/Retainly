"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, LayersIcon, BookOpen, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface FlashcardDeck {
  id: string;
  title: string;
  createdAt: string;
  cards: { id: string; keyword: string; hint: string; explanation: string }[];
}

const STORAGE_KEY = "retainly_flashcard_decks";

const DecksPage = () => {
  const router = useRouter();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDecks(JSON.parse(saved));
  }, []);

  const handleDelete = (id: string) => {
    const updated = decks.filter((d) => d.id !== id);
    setDecks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black mb-1">Saved Decks</h1>
          <p className="text-muted-foreground text-sm">
            {decks.length > 0
              ? `${decks.length} deck${decks.length !== 1 ? "s" : ""} · ${decks.reduce((a, d) => a + d.cards.length, 0)} total cards`
              : "No decks yet"}
          </p>
          <div className="mt-3 h-px w-12" style={{ background: "var(--theme-gradient)" }} />
        </div>
        <button
          onClick={() => router.push("/flashcards")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:brightness-110"
          style={{
            background: "var(--theme-gradient)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            borderColor: "transparent",
          }}
        >
          <Plus className="w-4 h-4" />
          New Deck
        </button>
      </div>

      {/* Empty state */}
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <LayersIcon className="w-8 h-8" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">No decks saved yet</p>
            <p className="text-sm text-muted-foreground">Generate flashcards to create your first deck.</p>
          </div>
          <button
            onClick={() => router.push("/flashcards")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
            style={{
              background: "var(--theme-gradient)",
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            Create a Deck
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
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.35)`;
                (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.07)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgb(var(--theme-glow) / 0.15)`;
                (e.currentTarget as HTMLDivElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.03)`;
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
                  <p className="font-bold text-base truncate">{deck.title}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(deck.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Card preview pills */}
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {deck.cards.slice(0, 4).map((card) => (
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
                    {deck.cards.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground">
                        +{deck.cards.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/flashcards/study?id=${deck.id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
                    style={{
                      background: "var(--theme-gradient)",
                      color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  >
                    Study
                  </button>
                  <button
                    onClick={() => handleDelete(deck.id)}
                    className="p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500"
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