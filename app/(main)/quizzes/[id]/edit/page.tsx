"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Terminal, ArrowLeft, Plus, Trash2, Check, X,
  ChevronDown, Loader2, Pencil, Globe, EyeOff, AlertCircle,
} from "lucide-react";
import {
  getQuiz, updateQuiz, deleteQuiz, publishQuiz, unpublishQuiz,
  createQuiz, Quiz, QuizQuestion,
} from "@/lib/db";

const CHOICE_LABELS = ["A", "B", "C", "D"];

const answerTextToLabel = (answerText: string, choices: string[]): string => {
  const idx = choices.indexOf(answerText);
  return idx !== -1 ? CHOICE_LABELS[idx] : "A";
};

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>{label}</span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

const QuestionRow = ({
  question, index, onSave, onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onSave: (index: number, data: Partial<QuizQuestion>) => Promise<string | null>;
  onDelete: (index: number) => Promise<string | null>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [qText, setQText] = useState(question.question);
  const [choices, setChoices] = useState<string[]>([...question.choices]);
  const [answerLabel, setAnswerLabel] = useState(
    answerTextToLabel(question.answer, question.choices)
  );
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rowError, setRowError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentAnswerText = choices[CHOICE_LABELS.indexOf(answerLabel)] ?? "";
  const isDirty =
    qText !== question.question ||
    explanation !== (question.explanation ?? "") ||
    currentAnswerText !== question.answer ||
    choices.some((c, i) => c !== question.choices[i]);

  const handleSave = async () => {
    if (!qText.trim()) return;
    setSaving(true);
    setRowError("");
    const answerIndex = CHOICE_LABELS.indexOf(answerLabel);
    const answerText = choices[answerIndex]?.trim() ?? choices[0]?.trim() ?? "";
    const err = await onSave(index, {
      question: qText.trim(),
      choices,
      answer: answerText,
      explanation: explanation.trim() || undefined,
    });
    setSaving(false);
    if (err) { setRowError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const err = await onDelete(index);
    if (err) { setRowError(err); setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? `rgb(var(--theme-glow) / 0.25)` : `rgb(var(--theme-glow) / 0.12)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
      }}>
      <button onClick={() => { setExpanded((p) => !p); setConfirmDelete(false); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
        style={{ backgroundColor: expanded ? `rgb(var(--theme-glow) / 0.04)` : "transparent" }}>
        <span className="font-mono text-[10px] w-7 h-7 rounded flex items-center justify-center shrink-0 border"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.5)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-sm font-semibold truncate">{qText || "—"}</span>
        {isDirty && (
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-primary)" }}>
            unsaved
          </span>
        )}
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", color: `rgb(var(--theme-glow) / 0.4)` }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
          <div className="space-y-1.5 pt-3">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// question</label>
            <textarea className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
              value={qText} onChange={(e) => setQText(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// choices</label>
            {choices.map((choice, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <button onClick={() => setAnswerLabel(CHOICE_LABELS[ci])}
                  className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] shrink-0 border transition-all"
                  style={{
                    borderColor: answerLabel === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: answerLabel === CHOICE_LABELS[ci] ? `rgb(var(--theme-glow) / 0.15)` : "transparent",
                    color: answerLabel === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.4)`,
                  }}>
                  {CHOICE_LABELS[ci]}
                </button>
                <input className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border transition-all"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                  value={choice}
                  onChange={(e) => { const u = [...choices]; u[ci] = e.target.value; setChoices(u); }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                  maxLength={200} />
              </div>
            ))}
            <p className="font-mono text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
              // click letter to set correct answer · currently: {answerLabel}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// explanation</label>
            <textarea className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all leading-relaxed"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 72 }}
              value={explanation} onChange={(e) => setExplanation(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
              placeholder="Optional explanation..." maxLength={1000} />
          </div>

          {rowError && (
            <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>// error: {rowError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={!isDirty || !qText.trim() || saving}
              className="flex-1 py-2.5 rounded-[3px] text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> saving...</>
                : saved ? <><Check className="w-3.5 h-3.5" /> saved</>
                : <><Check className="w-3.5 h-3.5" /> save_changes</>}
            </button>
            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-2.5 rounded-[3px] text-xs font-bold font-mono flex items-center gap-1.5 transition-all disabled:opacity-40"
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

const QuizEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newChoices, setNewChoices] = useState(["", "", "", ""]);
  const [newAnswerLabel, setNewAnswerLabel] = useState("A");
  const [newExplanation, setNewExplanation] = useState("");

  useEffect(() => {
    const loadQuiz = async () => {
      if (isNew) { setLoading(false); return; }
      const data = await getQuiz(id);
      if (!data) { router.push("/quizzes"); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.creator_id !== user.id) { router.push("/quizzes"); return; }
      setQuiz(data);
      setQuestions(data.questions ?? []);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setLoading(false);
    };
    loadQuiz();
  }, [id, isNew, router]);

  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);

  // ── Persist questions array to DB ──
  const persistQuestions = async (updated: QuizQuestion[]): Promise<string | null> => {
    if (isNew) return null;
    const { error } = await updateQuiz(id, {
      questions: updated,
      question_count: updated.length,
    });
    if (error) setSaveError(error);
    return error;
  };

  const handleSaveQuestion = async (index: number, data: Partial<QuizQuestion>): Promise<string | null> => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...data };
    setQuestions(updated);
    return persistQuestions(updated);
  };

  const handleDeleteQuestion = async (index: number): Promise<string | null> => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    return persistQuestions(updated);
  };

  // ── Top-level save ──
  const handleSaveQuiz = async () => {
    if (!title.trim()) { setSaveError("Quiz needs a title before saving."); return; }
    setSaving(true);
    setSaveError("");

    if (isNew) {
      if (questions.length === 0) {
        setSaveError("Add at least one question before saving.");
        setSaving(false);
        return;
      }
      const { data: created, error } = await createQuiz(title.trim(), questions, description);
      if (error || !created) {
        setSaveError(error ?? "Failed to save. Please try again.");
        setSaving(false);
        return;
      }
      router.push(`/quizzes/${created.id}/edit`);
    } else {
      const { error } = await updateQuiz(id, {
        title: title.trim(),
        description,
        questions,
        question_count: questions.length,
      });
      if (error) setSaveError(error);
    }
    setSaving(false);
  };

  // ── Add question ──
  const handleAddQuestion = async () => {
    if (!newQ.trim() || newChoices.some((c) => !c.trim())) return;
    const answerIndex = CHOICE_LABELS.indexOf(newAnswerLabel);
    const answerText = newChoices[answerIndex]?.trim() ?? newChoices[0]?.trim() ?? "";
    const newQuestion: QuizQuestion = {
      question: newQ.trim(),
      choices: newChoices.map((c) => c.trim()),
      answer: answerText,
      explanation: newExplanation.trim() || undefined,
    };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setNewQ(""); setNewChoices(["", "", "", ""]); setNewAnswerLabel("A"); setNewExplanation(""); setAdding(false);

    setSaving(true);
    setSaveError("");

    if (isNew && title.trim()) {
      const { data: created, error } = await createQuiz(title.trim(), updatedQuestions, description);
      setSaving(false);
      if (error || !created) { setSaveError(error ?? "Failed to save."); return; }
      router.replace(`/quizzes/${created.id}/edit`);
    } else if (!isNew) {
      const { error } = await updateQuiz(id, {
        questions: updatedQuestions,
        question_count: updatedQuestions.length,
      });
      setSaving(false);
      if (error) setSaveError(error);
    } else {
      setSaving(false);
    }
  };

  // ── Delete entire quiz (cascades stars + detaches attempts first) ──
  const handleDeleteQuiz = async () => {
    if (!confirmDeleteQuiz) { setConfirmDeleteQuiz(true); return; }
    setDeleting(true);
    const { error } = await deleteQuiz(id);
    if (!error) {
      router.push("/quizzes");
    } else {
      setSaveError(error);
      setDeleting(false);
      setConfirmDeleteQuiz(false);
    }
  };

  // ── Publish / unpublish ──
  const handlePublish = async () => {
    if (!description.trim()) { setPublishError("Description required to publish."); return; }
    setPublishError("");
    const { error } = await publishQuiz(id, description.trim());
    if (error) { setPublishError(`Publish failed: ${error}`); return; }
    setQuiz((prev) => prev ? { ...prev, is_published: true, description } : prev);
  };

  const handleUnpublish = async () => {
    const { error } = await unpublishQuiz(id);
    if (!error) setQuiz((prev) => prev ? { ...prev, is_published: false, published_at: null } : prev);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  const isPublished = quiz?.is_published ?? false;
  const saveDisabledReason = !title.trim() ? "add a title first" : questions.length === 0 ? "add at least one question" : null;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .card-enter { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-5 pt-14 pb-24 space-y-8 page-enter">
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
            <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
            <span>~/retainly/quizzes/edit</span>
          </div>

          <div className="space-y-3">
            <button onClick={() => router.push("/quizzes")}
              className="flex items-center gap-1.5 font-mono text-xs transition-all hover:opacity-70"
              style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
              <ArrowLeft className="w-3.5 h-3.5" /> back_to_quizzes
            </button>

            <div className="flex items-start gap-3">
              {editingTitle ? (
                <input ref={titleInputRef}
                  className="flex-1 text-4xl font-black bg-transparent outline-none border-b-2 pb-1"
                  style={{ borderColor: "var(--theme-primary)", color: "var(--foreground)" }}
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false);
                    if (e.key === "Escape") { setTitle(quiz?.title ?? ""); setEditingTitle(false); }
                  }}
                  onBlur={() => setEditingTitle(false)} maxLength={80} />
              ) : (
                <button className="flex items-start gap-2 group text-left" onClick={() => setEditingTitle(true)}>
                  <h1 className="text-4xl font-black tracking-tight leading-tight"
                    style={{ color: title ? "var(--foreground)" : `rgb(var(--theme-glow) / 0.3)` }}>
                    {title || "Untitled Quiz"}
                  </h1>
                  <Pencil className="w-4 h-4 mt-2 opacity-0 group-hover:opacity-40 transition-opacity shrink-0"
                    style={{ color: "var(--theme-primary)" }} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                // {questions.length} question{questions.length !== 1 ? "s" : ""}
                {saving && <span className="ml-2" style={{ color: "var(--theme-primary)" }}>saving...</span>}
              </p>

              {!isNew && (isPublished ? (
                <>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-badge-text)", border: `1px solid rgb(var(--theme-glow) / 0.2)` }}>
                    <Globe className="w-3 h-3" /> published
                  </span>
                  <button onClick={handleUnpublish}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all hover:opacity-70"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: "var(--theme-badge-text)", border: `1px solid rgb(var(--theme-glow) / 0.2)` }}>
                    <EyeOff className="w-3 h-3" /> unpublish
                  </button>
                </>
              ) : (
                <button onClick={handlePublish}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all hover:brightness-110"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: `rgb(var(--theme-glow) / 0.5)`, border: `1px solid rgb(var(--theme-glow) / 0.15)` }}>
                  <Globe className="w-3 h-3" /> publish
                </button>
              ))}

              {publishError && <p className="font-mono text-[10px] w-full" style={{ color: "#ef4444" }}>{publishError}</p>}

              {!isNew && (
                <button onClick={handleSaveQuiz} disabled={saving || !!saveDisabledReason}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: "var(--theme-primary)", color: "#fff" }}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> save</>}
                </button>
              )}

              {!isNew && (confirmDeleteQuiz ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={handleDeleteQuiz} disabled={deleting}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all disabled:opacity-40"
                    style={{ backgroundColor: "rgb(239 68 68 / 0.12)", color: "#ef4444", border: "1px solid rgb(239 68 68 / 0.3)" }}>
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "confirm_delete"}
                  </button>
                  <button onClick={() => setConfirmDeleteQuiz(false)}
                    className="px-2.5 py-1 rounded-lg font-mono text-[10px] transition-all"
                    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)", border: `1px solid rgb(var(--theme-glow) / 0.15)` }}>
                    cancel
                  </button>
                </div>
              ) : (
                <button onClick={handleDeleteQuiz}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all"
                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)`, color: `rgb(var(--theme-glow) / 0.4)`, border: `1px solid rgb(var(--theme-glow) / 0.12)` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgb(239 68 68 / 0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(239 68 68 / 0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.04)`; (e.currentTarget as HTMLButtonElement).style.color = `rgb(var(--theme-glow) / 0.4)`; (e.currentTarget as HTMLButtonElement).style.borderColor = `rgb(var(--theme-glow) / 0.12)`; }}>
                  <Trash2 className="w-3 h-3" /> delete_quiz
                </button>
              ))}
            </div>

            {saveDisabledReason && !isNew && (
              <div className="flex items-center gap-2 font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                <AlertCircle className="w-3 h-3" /><span>// {saveDisabledReason}</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-[10px]"
                style={{ borderColor: "rgb(239 68 68 / 0.3)", backgroundColor: "rgb(239 68 68 / 0.06)", color: "#ef4444" }}>
                <AlertCircle className="w-3 h-3 shrink-0" /><span>{saveError}</span>
              </div>
            )}

            {isNew && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-[10px]"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)`, color: `rgb(var(--theme-glow) / 0.45)` }}>
                <span style={{ color: "var(--theme-primary)" }}>$</span>
                <span>{!title.trim() ? "enter a title above, then add your first question to save" : "add your first question below — it will be saved automatically"}</span>
              </div>
            )}
          </div>

          <div>
            <SectionRule label="// QUESTIONS" />
            <div className="space-y-2.5">
              {questions.length === 0 && !adding ? (
                <div className="rounded-2xl border px-5 py-8 text-center"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                  <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>// no questions yet — add one below</p>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div key={i} className="card-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    <QuestionRow question={q} index={i} onSave={handleSaveQuestion} onDelete={handleDeleteQuestion} />
                  </div>
                ))
              )}
            </div>
          </div>

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
                      placeholder="Question text..." maxLength={500} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// choices (click letter = correct answer)</label>
                    {newChoices.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button onClick={() => setNewAnswerLabel(CHOICE_LABELS[ci])}
                          className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] shrink-0 border transition-all"
                          style={{
                            borderColor: newAnswerLabel === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                            backgroundColor: newAnswerLabel === CHOICE_LABELS[ci] ? `rgb(var(--theme-glow) / 0.15)` : "transparent",
                            color: newAnswerLabel === CHOICE_LABELS[ci] ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.4)`,
                          }}>
                          {CHOICE_LABELS[ci]}
                        </button>
                        <input className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border transition-all"
                          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)" }}
                          value={c} onChange={(e) => { const u = [...newChoices]; u[ci] = e.target.value; setNewChoices(u); }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                          placeholder={`Choice ${CHOICE_LABELS[ci]}...`} maxLength={200} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>// explanation (optional)</label>
                    <textarea className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.03)`, borderColor: `rgb(var(--theme-glow) / 0.15)`, color: "var(--foreground)", minHeight: 60 }}
                      value={newExplanation} onChange={(e) => setNewExplanation(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--theme-primary)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `rgb(var(--theme-glow) / 0.15)`; }}
                      placeholder="Optional explanation..." maxLength={1000} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleAddQuestion}
                      disabled={!newQ.trim() || newChoices.some((c) => !c.trim()) || saving}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:brightness-110"
                      style={{ background: "var(--theme-primary)", color: "#fff" }}>
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> saving...</> : <><Plus className="w-3.5 h-3.5" /> add_question</>}
                    </button>
                    <button onClick={() => { setAdding(false); setNewQ(""); setNewChoices(["", "", "", ""]); setNewAnswerLabel("A"); setNewExplanation(""); }}
                      className="px-3 py-2.5 rounded-xl text-xs font-mono transition-all"
                      style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)`, color: "var(--muted-foreground)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { if (isNew && !title.trim()) { setSaveError("Enter a title before adding questions."); return; } setSaveError(""); setAdding(true); }}
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