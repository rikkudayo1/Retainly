"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Terminal,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  getDeck,
  updateCard,
  deleteCard,
  createCard,
  updateDeckTitle,
  DBCard,
  DBDeck,
} from "@/lib/db";

// ─── Section rule (same as quiz page) ────────────────────────
const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

// ─── Single card row ──────────────────────────────────────────
const CardRow = ({
  card,
  index,
  onSave,
  onDelete,
}: {
  card: DBCard;
  index: number;
  onSave: (id: string, data: Partial<Pick<DBCard, "keyword" | "hint" | "explanation">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState(card.keyword);
  const [hint, setHint] = useState(card.hint);
  const [explanation, setExplanation] = useState(card.explanation);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty =
    keyword !== card.keyword ||
    hint !== card.hint ||
    explanation !== card.explanation;

  const handleSave = async () => {
    if (!keyword.trim()) return;
    setSaving(true);
    await onSave(card.id, { keyword: keyword.trim(), hint: hint.trim(), explanation: explanation.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await onDelete(card.id);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? `rgb(var(--theme-glow) / 0.25)` : `rgb(var(--theme-glow) / 0.12)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}
    >
      {/* Row header — click to expand */}
      <button
        onClick={() => { setExpanded((p) => !p); setConfirmDelete(false); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
        style={{ backgroundColor: expanded ? `rgb(var(--theme-glow) / 0.04)` : "transparent" }}
      >
        {/* Index badge */}
        <span
          className="font-mono text-[10px] w-7 h-7 rounded flex items-center justify-center shrink-0 border"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.2)`,
            color: `rgb(var(--theme-glow) / 0.5)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Keyword preview */}
        <span className="flex-1 text-sm font-semibold truncate">{keyword || "—"}</span>

        {/* Dirty indicator */}
        {isDirty && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "var(--theme-primary)" }}
          />
        )}

        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            color: `rgb(var(--theme-glow) / 0.4)`,
          }}
        />
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>

          {/* Keyword */}
          <div className="space-y-1.5 pt-3">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // keyword
            </label>
            <input
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border font-medium transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--foreground)",
              }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              placeholder="Keyword..."
              maxLength={100}
            />
          </div>

          {/* Hint */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // hint
            </label>
            <input
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--foreground)",
              }}
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              placeholder="One-sentence clue..."
              maxLength={200}
            />
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // explanation
            </label>
            <textarea
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                color: "var(--foreground)",
                minHeight: 88,
              }}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              placeholder="Full explanation..."
              maxLength={1000}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!isDirty || saving || !keyword.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> saved</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> save_changes</>
              )}
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: "rgb(239 68 68 / 0.12)", color: "#ef4444", border: "1px solid rgb(239 68 68 / 0.3)" }}
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2.5 rounded-xl text-xs font-mono transition-all"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="px-3 py-2.5 rounded-xl text-xs font-mono transition-all"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgb(239 68 68 / 0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`;
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────
const DeckEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [deck, setDeck] = useState<DBDeck | null>(null);
  const [cards, setCards] = useState<DBCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Title editing
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Adding new card
  const [adding, setAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    getDeck(id).then((data) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setDeck(data);
      setTitle(data.title);
      setCards(data.cards ?? []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const handleSaveTitle = async () => {
    if (!title.trim() || title.trim() === deck?.title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    await updateDeckTitle(id, title.trim());
    setDeck((prev) => prev ? { ...prev, title: title.trim() } : prev);
    setSavingTitle(false);
    setEditingTitle(false);
  };

  const handleSaveCard = async (
    cardId: string,
    data: Partial<Pick<DBCard, "keyword" | "hint" | "explanation">>
  ) => {
    await updateCard(cardId, data);
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, ...data } : c));
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleAddCard = async () => {
    if (!newKeyword.trim()) return;
    setSavingNew(true);
    const created = await createCard(id, {
      keyword: newKeyword.trim(),
      hint: newHint.trim(),
      explanation: newExplanation.trim(),
    });
    if (created) {
      setCards((prev) => [...prev, created]);
      setNewKeyword("");
      setNewHint("");
      setNewExplanation("");
      setAdding(false);
    }
    setSavingNew(false);
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  // ── Not found ──
  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="font-mono text-sm" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// 404</p>
      <p className="font-bold text-lg">Deck not found</p>
      <button onClick={() => router.push("/flashcards/decks")}
        className="text-sm font-mono mt-2"
        style={{ color: "var(--theme-primary)" }}>
        ← back_to_decks
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .card-enter { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-5 pt-14 pb-24 space-y-8 page-enter">

          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-2 font-mono text-[11px]"
            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
            <span>~/retainly/decks/edit</span>
          </div>

          {/* ── Header ── */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/flashcards/decks")}
              className="flex items-center gap-1.5 font-mono text-xs transition-all hover:opacity-70"
              style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> back_to_decks
            </button>

            {/* Editable title */}
            <div className="flex items-start gap-3">
              {editingTitle ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    className="flex-1 text-4xl font-black bg-transparent outline-none border-b-2 pb-1"
                    style={{ borderColor: "var(--theme-primary)", color: "var(--foreground)" }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") { setTitle(deck?.title ?? ""); setEditingTitle(false); }
                    }}
                    onBlur={handleSaveTitle}
                    maxLength={80}
                  />
                  {savingTitle && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--theme-primary)" }} />}
                </div>
              ) : (
                <button
                  className="flex items-start gap-2 group text-left"
                  onClick={() => setEditingTitle(true)}
                  title="Click to rename"
                >
                  <h1 className="text-4xl font-black tracking-tight leading-tight">{title}</h1>
                  <Pencil
                    className="w-4 h-4 mt-2 opacity-0 group-hover:opacity-40 transition-opacity shrink-0"
                    style={{ color: "var(--theme-primary)" }}
                  />
                </button>
              )}
            </div>

            <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // {cards.length} card{cards.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* ── Cards list ── */}
          <div>
            <SectionRule label="// FLASHCARDS" />
            <div className="space-y-2.5">
              {cards.length === 0 && !adding ? (
                <div
                  className="rounded-2xl border px-5 py-8 text-center"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
                >
                  <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                    // no cards yet — add one below
                  </p>
                </div>
              ) : (
                cards.map((card, i) => (
                  <div key={card.id} className="card-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    <CardRow
                      card={card}
                      index={i}
                      onSave={handleSaveCard}
                      onDelete={handleDeleteCard}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Add new card ── */}
          <div>
            <SectionRule label="// ADD CARD" />

            {adding ? (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.25)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
              >
                {/* Titlebar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-2.5 border-b"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400/50" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
                  <span className="w-2 h-2 rounded-full bg-green-400/50" />
                  <span className="ml-3 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    new_card.sh
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {/* Keyword */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      // keyword *
                    </label>
                    <input
                      autoFocus
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border font-medium transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="Term or concept..."
                      maxLength={100}
                    />
                  </div>

                  {/* Hint */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      // hint
                    </label>
                    <input
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                      value={newHint}
                      onChange={(e) => setNewHint(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="One-sentence clue..."
                      maxLength={200}
                    />
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                      // explanation
                    </label>
                    <textarea
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 88 }}
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="Full explanation..."
                      maxLength={1000}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddCard}
                      disabled={!newKeyword.trim() || savingNew}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all"
                      style={{ background: "var(--theme-primary)", color: "#fff" }}
                    >
                      {savingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> add_card</>}
                    </button>
                    <button
                      onClick={() => { setAdding(false); setNewKeyword(""); setNewHint(""); setNewExplanation(""); }}
                      className="px-3 py-2.5 rounded-xl text-xs font-mono transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full py-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 border transition-all hover:opacity-80"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  color: "var(--theme-badge-text)",
                  borderStyle: "dashed",
                }}
              >
                <Plus className="w-3.5 h-3.5" /> new_card
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DeckEditPage;