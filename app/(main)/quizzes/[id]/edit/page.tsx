"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Terminal, ArrowLeft, Plus, Trash2, Check, X,
  ChevronDown, Loader2, Pencil, Globe,
} from "lucide-react";
import {
  getQuizSession,
  updateQuizTitle,
  updateQuizQuestion,
  deleteQuizQuestion,
  addQuizQuestion,
  publishQuiz,
  unpublishQuiz,
  DBQuizSession,
  QuizQuestion,
} from "@/lib/db";

const CHOICE_LABELS = ["A", "B", "C", "D"];

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

// ─── Question row ─────────────────────────────────────────────
const QuestionRow = ({
  question, index, onSave, onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onSave: (index: number, data: Partial<QuizQuestion>) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [qText, setQText] = useState(question.question);
  const [choices, setChoices] = useState<string[]>([...question.choices]);
  const [answer, setAnswer] = useState(question.answer);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty =
    qText !== question.question ||
    explanation !== (question.explanation ?? "") ||
    answer !== question.answer ||
    choices.some((c, i) => c !== question.choices[i]);

  const handleSave = async () => {
    if (!qText.trim()) return;
    setSaving(true);
    const answerIndex = CHOICE_LABELS.indexOf(answer);
    const answerText = choices[answerIndex] ?? answer;
    await onSave(index, { question: qText.trim(), choices, answer: answerText, explanation: explanation.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await onDelete(index);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? `rgb(var(--theme-glow) / 0.25)` : `rgb(var(--theme-glow) / 0.12)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => { setExpanded((p) => !p); setConfirmDelete(false); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
        style={{ backgroundColor: expanded ? `rgb(var(--theme-glow) / 0.04)` : "transparent" }}
      >
        <span className="font-mono text-[10px] w-7 h-7 rounded flex items-center justify-center shrink-0 border"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.5)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-sm font-semibold truncate">{qText || "—"}</span>
        {isDirty && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--theme-primary)" }} />}
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>

          {/* Question text */}
          <div className="space-y-1.5 pt-3">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// question</label>
            <textarea
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              maxLength={500}
            />
          </div>

          {/* Choices */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// choices</label>
            {choices.map((choice, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <button
                  onClick={() => setAnswer(CHOICE_LABELS[ci])}
                  className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] shrink-0 border transition-all"
                  style={{
                    borderColor: answer === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: answer === CHOICE_LABELS[ci] ? `rgb(var(--theme-glow) / 0.15)` : "transparent",
                    color: answer === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.4)`,
                  }}
                  title={`Set ${CHOICE_LABELS[ci]} as correct answer`}
                >
                  {CHOICE_LABELS[ci]}
                </button>
                <input
                  className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border transition-all"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                  value={choice}
                  onChange={(e) => {
                    const updated = [...choices];
                    updated[ci] = e.target.value;
                    setChoices(updated);
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                  maxLength={200}
                />
              </div>
            ))}
            <p className="font-mono text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
              // click letter to set correct answer · currently: {answer}
            </p>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// explanation</label>
            <textarea
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              placeholder="Optional explanation..."
              maxLength={1000}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving || !qText.trim()}
              className="flex-1 py-2.5 rounded-[3px] text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : saved ? <><Check className="w-3.5 h-3.5" /> saved</>
                : <><Check className="w-3.5 h-3.5" /> save_changes</>}
            </button>

            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-2.5 rounded-[3px] text-xs font-bold font-mono flex items-center gap-1.5 transition-all"
                  style={{ backgroundColor: "rgb(239 68 68 / 0.12)", color: "#ef4444", border: "1px solid rgb(239 68 68 / 0.3)" }}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "confirm"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2.5 rounded-[3px] text-xs font-mono transition-all"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={handleDelete}
                className="px-3 py-2.5 rounded-[3px] text-xs font-mono transition-all"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgb(239 68 68 / 0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.06)`; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"; }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Publish modal ────────────────────────────────────────────
const PublishModal = ({ onPublish, onClose }: { onPublish: (title: string, desc: string) => Promise<void>; onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!title.trim()) { setError("// title is required"); return; }
    setSaving(true);
    await onPublish(title.trim(), desc.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="relative rounded-2xl overflow-hidden w-full max-w-sm"
        style={{ backgroundColor: "var(--background)", border: `1px solid rgb(var(--theme-glow) / 0.2)` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
          <span className="w-2 h-2 rounded-full bg-red-400/50" />
          <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
          <span className="w-2 h-2 rounded-full bg-green-400/50" />
          <span className="ml-3 font-mono text-[10px] flex-1" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>publish_quiz.sh</span>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-black">Publish Quiz</h2>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              // share with the community
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// title *</label>
            <input autoFocus className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
              placeholder="Quiz title..."
              value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// description</label>
            <textarea className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
              placeholder="What is this quiz about..."
              value={desc} onChange={(e) => setDesc(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              maxLength={200} />
          </div>
          {error && <p className="font-mono text-xs" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)", border: `1px solid rgb(var(--theme-glow) / 0.12)` }}>
              cancel
            </button>
            <button onClick={handle} disabled={saving || !title.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Globe className="w-3.5 h-3.5" /> $ publish</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────
const QuizEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<DBQuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newChoices, setNewChoices] = useState(["", "", "", ""]);
  const [newAnswer, setNewAnswer] = useState("A");
  const [newExplanation, setNewExplanation] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    getQuizSession(id).then((data) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      if (data.source_published_quiz_id) {
        // community quiz — redirect back
        router.replace("/quizzes");
        return;
      }
      setQuiz(data);
      setTitle(data.title);
      setQuestions(data.questions ?? []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const handleSaveTitle = async () => {
    if (!title.trim() || title.trim() === quiz?.title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    await updateQuizTitle(id, title.trim());
    setQuiz((prev) => prev ? { ...prev, title: title.trim() } : prev);
    setSavingTitle(false);
    setEditingTitle(false);
  };

  const handleSaveQuestion = async (index: number, data: Partial<QuizQuestion>) => {
    await updateQuizQuestion(id, index, data, questions);
    setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, ...data } : q));
  };

  const handleDeleteQuestion = async (index: number) => {
    await deleteQuizQuestion(id, index, questions);
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = async () => {
    if (!newQ.trim() || newChoices.some((c) => !c.trim())) return;
    setSavingNew(true);
    const answerIndex = CHOICE_LABELS.indexOf(newAnswer);
    const q: QuizQuestion = {
      question: newQ.trim(),
      choices: newChoices.map((c) => c.trim()),
      answer: newChoices[answerIndex]?.trim() ?? newAnswer,
      explanation: newExplanation.trim() || undefined,
    };
    await addQuizQuestion(id, q, questions);
    setQuestions((prev) => [...prev, q]);
    setNewQ(""); setNewChoices(["", "", "", ""]); setNewAnswer("A"); setNewExplanation(""); setAdding(false);
    setSavingNew(false);
  };

  const handlePublish = async (pubTitle: string, desc: string) => {
    const { error } = await publishQuiz(id, pubTitle, desc);
    if (!error) {
      setPublishSuccess(true);
      setShowPublishModal(false);
      setQuiz((prev) => prev ? { ...prev, source_published_quiz_id: "published" } : prev);
    }
  };

  const handleUnpublish = async () => {
    if (!quiz?.source_published_quiz_id) return;
    await unpublishQuiz(quiz.source_published_quiz_id);
    setQuiz((prev) => prev ? { ...prev, source_published_quiz_id: null } : prev);
    setPublishSuccess(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="font-mono text-sm" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// 404</p>
      <p className="font-bold text-lg">Quiz not found</p>
      <button onClick={() => router.push("/quizzes")} className="text-sm font-mono mt-2" style={{ color: "var(--theme-primary)" }}>
        ← back_to_quizzes
      </button>
    </div>
  );

  const isPublished = !!quiz?.source_published_quiz_id;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .card-enter { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
      `}</style>

      {showPublishModal && (
        <PublishModal
          onPublish={handlePublish}
          onClose={() => setShowPublishModal(false)}
        />
      )}

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-5 pt-14 pb-24 space-y-8 page-enter">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
            <span>~/retainly/quizzes/edit</span>
          </div>

          {/* Header */}
          <div className="space-y-3">
            <button onClick={() => router.push("/quizzes")}
              className="flex items-center gap-1.5 font-mono text-xs transition-all hover:opacity-70"
              style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
              <ArrowLeft className="w-3.5 h-3.5" /> back_to_quizzes
            </button>

            {/* Editable title */}
            <div className="flex items-start gap-3">
              {editingTitle ? (
                <div className="flex-1 flex items-center gap-2">
                  <input ref={titleInputRef}
                    className="flex-1 text-4xl font-black bg-transparent outline-none border-b-2 pb-1"
                    style={{ borderColor: "var(--theme-primary)", color: "var(--foreground)" }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") { setTitle(quiz?.title ?? ""); setEditingTitle(false); } }}
                    onBlur={handleSaveTitle}
                    maxLength={80} />
                  {savingTitle && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--theme-primary)" }} />}
                </div>
              ) : (
                <button className="flex items-start gap-2 group text-left" onClick={() => setEditingTitle(true)}>
                  <h1 className="text-4xl font-black tracking-tight leading-tight">{title}</h1>
                  <Pencil className="w-4 h-4 mt-2 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" style={{ color: "var(--theme-primary)" }} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                // {questions.length} question{questions.length !== 1 ? "s" : ""}
              </p>

              {/* Publish / unpublish */}
              {isPublished || publishSuccess ? (
                <button onClick={handleUnpublish}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all hover:opacity-70"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-badge-text)", border: `1px solid rgb(var(--theme-glow) / 0.2)` }}>
                  <Globe className="w-3 h-3" /> published · unpublish
                </button>
              ) : (
                <button onClick={() => setShowPublishModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all hover:brightness-110"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: `rgb(var(--theme-glow) / 0.5)`, border: `1px solid rgb(var(--theme-glow) / 0.15)` }}>
                  <Globe className="w-3 h-3" /> publish
                </button>
              )}
            </div>
          </div>

          {/* Questions list */}
          <div>
            <SectionRule label="// QUESTIONS" />
            <div className="space-y-2.5">
              {questions.length === 0 && !adding ? (
                <div className="rounded-2xl border px-5 py-8 text-center"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                  <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                    // no questions yet — add one below
                  </p>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="card-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    <QuestionRow
                      question={q}
                      index={i}
                      onSave={handleSaveQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add new question */}
          <div>
            <SectionRule label="// ADD QUESTION" />

            {adding ? (
              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.25)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>
                  <span className="w-2 h-2 rounded-full bg-red-400/50" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
                  <span className="w-2 h-2 rounded-full bg-green-400/50" />
                  <span className="ml-3 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>new_question.sh</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// question *</label>
                    <textarea autoFocus
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
                      value={newQ} onChange={(e) => setNewQ(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="Question text..."
                      maxLength={500} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// choices (click letter = correct)</label>
                    {newChoices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button onClick={() => setNewAnswer(CHOICE_LABELS[ci])}
                          className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] shrink-0 border transition-all"
                          style={{
                            borderColor: newAnswer === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                            backgroundColor: newAnswer === CHOICE_LABELS[ci] ? `rgb(var(--theme-glow) / 0.15)` : "transparent",
                            color: newAnswer === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.4)`,
                          }}>
                          {CHOICE_LABELS[ci]}
                        </button>
                        <input
                          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border transition-all"
                          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                          value={c}
                          onChange={(e) => { const u = [...newChoices]; u[ci] = e.target.value; setNewChoices(u); }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                          placeholder={`Choice ${CHOICE_LABELS[ci]}...`}
                          maxLength={200} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// explanation</label>
                    <textarea
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 60 }}
                      value={newExplanation} onChange={(e) => setNewExplanation(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="Optional explanation..."
                      maxLength={1000} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleAddQuestion}
                      disabled={!newQ.trim() || newChoices.some((c) => !c.trim()) || savingNew}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
                      style={{ background: "var(--theme-primary)", color: "#fff" }}>
                      {savingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> add_question</>}
                    </button>
                    <button onClick={() => { setAdding(false); setNewQ(""); setNewChoices(["", "", "", ""]); setNewAnswer("A"); setNewExplanation(""); }}
                      className="px-3 py-2.5 rounded-xl text-xs font-mono transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)}
                className="w-full py-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 border transition-all hover:opacity-80"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: "var(--theme-badge-text)", borderStyle: "dashed" }}>
                <Plus className="w-3.5 h-3.5" /> new_question
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizEditPage;