"use client";

import { useState } from "react";
import { Terminal, X, Check, Loader2 } from "lucide-react";
import { saveQuizSession, QuizQuestion } from "@/lib/db";

interface SaveQuizModalProps {
  questions: QuizQuestion[];
  score: number;
  total: number;
  onSaved: (id: string) => void;
  onClose: () => void;
}

const SaveQuizModal = ({ questions, score, total, onSaved, onClose }: SaveQuizModalProps) => {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("// title is required"); return; }
    setSaving(true);
    setError("");
    const session = await saveQuizSession(title.trim(), questions, score, total);
    setSaving(false);
    if (!session) { setError("// failed to save, try again"); return; }
    onSaved(session.id);
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-sm"
        style={{
          backgroundColor: "var(--background)",
          border: `1px solid rgb(var(--theme-glow) / 0.2)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 border-b"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
        >
          <span className="w-2 h-2 rounded-full bg-red-400/50" />
          <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
          <span className="w-2 h-2 rounded-full bg-green-400/50" />
          <span className="ml-3 font-mono text-[10px] flex-1" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            save_quiz.sh
          </span>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/quizzes</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Save Quiz</h2>
            <p className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // {questions.length} questions · score {score}/{total}
            </p>
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // quiz title *
            </label>
            <input
              autoFocus
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--foreground)",
              }}
              placeholder="e.g. Biology Chapter 4..."
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
              maxLength={80}
            />
          </div>

          {error && (
            <p className="font-mono text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                color: "var(--muted-foreground)",
                border: `1px solid rgb(var(--theme-glow) / 0.12)`,
              }}
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> saving...</>
                : <><Check className="w-3.5 h-3.5" /> $ save_quiz</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveQuizModal;