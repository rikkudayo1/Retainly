// components/PublicQuizCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Star,
  CircleQuestionMark,
  Plus,
  Check,
  Trash2,
  EyeOff,
} from "lucide-react";
import {
  PublishedQuiz,
  toggleQuizStar,
  addPublishedQuizToMySessions,
} from "@/lib/db";

interface PublicQuizCardProps {
  quiz: PublishedQuiz;
  isOwn?: boolean;
  onUnpublish?: (id: string) => void;
  onDelete?: (id: string) => void;
  added?: boolean;
  onAdded?: (id: string) => void;
  onToast?: (message: string, error?: boolean) => void;
}

const PublicQuizCard = ({
  quiz,
  isOwn = false,
  onUnpublish,
  onDelete,
  added = false,
  onAdded,
  onToast,
}: PublicQuizCardProps) => {
  const [starred, setStarred] = useState(quiz.is_starred);
  const [starCount, setStarCount] = useState(quiz.star_count);
  const [adding, setAdding] = useState(false);

  const handleStar = async () => {
    if (isOwn) return;
    const result = await toggleQuizStar(quiz.id, starred);
    if (result !== starred) setStarCount((p) => (result ? p + 1 : p - 1));
    setStarred(result);
  };

  const handleAdd = async () => {
    if (adding || added || isOwn) return;
    setAdding(true);
    const { error } = await addPublishedQuizToMySessions(quiz.id);
    setAdding(false);
    if (error) {
      onToast?.("Failed to add quiz. Try again.", true);
      return;
    }
    onAdded?.(quiz.id);
    onToast?.(`"${quiz.title}" added to your quizzes!`);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d_ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo_ago`;
    return `${Math.floor(months / 12)}y_ago`;
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
      style={{
        border: `1px solid ${
          isOwn
            ? "rgb(var(--theme-glow) / 0.25)"
            : added
            ? "rgb(34 197 94 / 0.25)"
            : `rgb(var(--theme-glow) / 0.15)`
        }`,
        backgroundColor: isOwn
          ? "rgb(var(--theme-glow) / 0.04)"
          : `rgb(var(--theme-glow) / 0.02)`,
        opacity: isOwn ? 0.6 : added ? 0.75 : 1,
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
          style={{
            backgroundColor: isOwn
              ? "var(--theme-primary)"
              : added
              ? "#22c55e"
              : "var(--theme-primary)",
            opacity: 0.7,
          }}
        />
        <span
          className="font-mono text-[9px] truncate flex-1"
          style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
        >
          {quiz.title.toLowerCase().replace(/\s+/g, "_")}.quiz
        </span>
        {/* Star button */}
        <button
          onClick={handleStar}
          disabled={isOwn}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all hover:brightness-110 shrink-0"
          style={{
            backgroundColor: starred
              ? "rgb(234 179 8 / 0.1)"
              : `rgb(var(--theme-glow) / 0.06)`,
            color: starred ? "#eab308" : `rgb(var(--theme-glow) / 0.4)`,
            border: `1px solid ${
              starred ? "rgb(234 179 8 / 0.3)" : `rgb(var(--theme-glow) / 0.12)`
            }`,
            cursor: isOwn ? "default" : "pointer",
          }}
        >
          <Star
            className="w-3 h-3"
            fill={starred ? "#eab308" : "none"}
            strokeWidth={starred ? 0 : 1.5}
          />
          {starCount}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + description */}
        <div className="space-y-1">
          <h3 className="font-black text-base leading-tight text-foreground">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p
              className="font-mono text-[10px] line-clamp-2 leading-relaxed"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
            >
              // {quiz.description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div
          className="flex items-center gap-3 font-mono text-[10px]"
          style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
        >
          <span className="flex items-center gap-1">
            <CircleQuestionMark className="w-3 h-3" />
            {quiz.question_count}
          </span>
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" />
            {quiz.add_count}
          </span>
          <span>{timeAgo(quiz.created_at)}</span>
        </div>

        {/* Author */}
        <Link
          href={quiz.username ? `/profile/${quiz.username}` : "#"}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 w-fit transition-opacity hover:opacity-70"
        >
          <div
            className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-black shrink-0"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
              color: "var(--theme-primary)",
            }}
          >
            {quiz.avatar_url ? (
              <img
                src={quiz.avatar_url}
                alt={quiz.username ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              quiz.username?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <span
            className="font-mono text-[10px]"
            style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
          >
            {isOwn ? "you" : `@${quiz.username ?? "anonymous"}`}
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        {isOwn ? (
          onUnpublish || onDelete ? (
            <div
              className="flex gap-2 pt-3 border-t"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}
            >
              <button
                onClick={() => onUnpublish?.(quiz.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold font-mono transition-all hover:brightness-110"
                style={{
                  border: `1px solid rgb(var(--theme-glow) / 0.15)`,
                  color: `rgb(var(--theme-glow) / 0.5)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                }}
              >
                <EyeOff className="w-3 h-3" />
                unpublish
              </button>
              <button
                onClick={() => onDelete?.(quiz.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold font-mono transition-all hover:brightness-110"
                style={{
                  border: "1px solid rgb(239 68 68 / 0.25)",
                  color: "#ef4444",
                  backgroundColor: "rgb(239 68 68 / 0.04)",
                }}
              >
                <Trash2 className="w-3 h-3" />
                delete
              </button>
            </div>
          ) : (
            <div
              className="pt-3 border-t font-mono text-[10px] text-center"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.08)`,
                color: `rgb(var(--theme-glow) / 0.3)`,
              }}
            >
              // your publication
            </div>
          )
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding || added}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[3px] text-xs font-bold font-mono transition-all hover:brightness-110 disabled:opacity-60 mt-1"
            style={
              added
                ? {
                    backgroundColor: "rgb(34 197 94 / 0.08)",
                    color: "#22c55e",
                    border: "1px solid rgb(34 197 94 / 0.25)",
                  }
                : { background: "var(--theme-primary)", color: "#fff" }
            }
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> added
              </>
            ) : adding ? (
              "$ adding..."
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                add_to_quizzes
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PublicQuizCard;