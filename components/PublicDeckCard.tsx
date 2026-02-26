"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, BookOpen, Plus, Check, Trash2, EyeOff } from "lucide-react";
import { PublicDeck, toggleStar, addPublicDeckToMyDecks } from "@/lib/db";

interface PublicDeckCardProps {
  deck: PublicDeck;
  isOwn?: boolean;
  onUnpublish?: (id: string) => void;
  onDelete?: (id: string) => void;
  added?: boolean;
  onAdded?: (id: string) => void;
  onToast?: (message: string, error?: boolean) => void;
}

const PublicDeckCard = ({
  deck,
  isOwn = false,
  onUnpublish,
  onDelete,
  added = false,
  onAdded,
  onToast,
}: PublicDeckCardProps) => {
  const [starred, setStarred] = useState(deck.is_starred);
  const [starCount, setStarCount] = useState(deck.star_count);
  const [adding, setAdding] = useState(false);

  const handleStar = async () => {
    const result = await toggleStar(deck.id, starred);
    if (result !== starred) {
      setStarCount((p) => (result ? p + 1 : p - 1));
    }
    setStarred(result);
  };

  const handleAdd = async () => {
    if (adding || added) return;
    setAdding(true);
    const { error } = await addPublicDeckToMyDecks(deck.id);
    setAdding(false);
    if (error) {
      onToast?.("Failed to add deck. Try again.", true);
      return;
    }
    onAdded?.(deck.id);
    onToast?.(`"${deck.title}" added to your decks!`);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  return (
    <div
      className="relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200"
      style={{
        borderColor: added
          ? "rgb(34 197 94 / 0.3)"
          : `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: added
          ? "rgb(34 197 94 / 0.03)"
          : `rgb(var(--theme-glow) / 0.03)`,
        opacity: added ? 0.7 : 1,
      }}
    >
      {/* Top row — title + star */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base truncate text-foreground">
            {deck.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {deck.description}
          </p>
        </div>

        <button
          onClick={handleStar}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:brightness-110 shrink-0"
          style={{
            borderColor: starred
              ? "rgb(234 179 8 / 0.4)"
              : `rgb(var(--theme-glow) / 0.2)`,
            backgroundColor: starred
              ? "rgb(234 179 8 / 0.08)"
              : `rgb(var(--theme-glow) / 0.04)`,
            color: starred ? "#eab308" : "var(--muted-foreground)",
          }}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={starred ? "#eab308" : "none"}
            strokeWidth={starred ? 0 : 1.5}
          />
          {starCount}
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {deck.card_count} cards
        </span>
        <span className="flex items-center gap-1">
          <Plus className="w-3 h-3" />
          {deck.add_count} added
        </span>
        <span>{timeAgo(deck.created_at)}</span>
      </div>

      {/* Author */}
      <Link
        href={deck.username ? `/profile/${deck.username}` : "#"}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 w-fit transition-opacity hover:opacity-70"
      >
        <div
          className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black shrink-0"
          style={{
            backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
            color: "var(--theme-primary)",
          }}
        >
          {deck.avatar_url ? (
            <img
              src={deck.avatar_url}
              alt={deck.username ?? ""}
              className="w-full h-full object-cover"
            />
          ) : (
            (deck.username?.[0]?.toUpperCase() ?? "?")
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {deck.username ?? "Anonymous"}
        </span>
      </Link>

      {/* Bottom actions */}
      {isOwn ? (
        onUnpublish || onDelete ? (
          <div
            className="flex gap-2 pt-1 border-t"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <button
              onClick={() => onUnpublish?.(deck.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.2)`,
                color: "var(--muted-foreground)",
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              }}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Make Private
            </button>
            <button
              onClick={() => onDelete?.(deck.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
              style={{
                borderColor: "rgb(239 68 68 / 0.3)",
                color: "#ef4444",
                backgroundColor: "rgb(239 68 68 / 0.04)",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        ) : (
          <div
            className="pt-3 border-t text-xs text-center text-muted-foreground/40"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)` }}
          >
            It's Your deck
          </div>
        )
      ) : (
        <button
          onClick={handleAdd}
          disabled={adding || added}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60 border-t pt-3"
          style={{
            background: added ? "transparent" : "var(--theme-gradient)",
            color: added ? "#22c55e" : "#fff",
            textShadow: added ? "none" : "0 1px 3px rgba(0,0,0,0.3)",
            borderColor: added ? "rgb(34 197 94 / 0.3)" : "transparent",
            marginTop: "auto",
          }}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" /> Added to your decks
            </>
          ) : adding ? (
            "Adding..."
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add to My Decks
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PublicDeckCard;
