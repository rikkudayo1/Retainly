"use client";

import { useEffect, useState } from "react";
import { Globe, ChevronDown, FileText } from "lucide-react";
import {
  getDecks,
  getMyPublishedDecks,
  publishDeck,
  unpublishDeck,
  deleteDeck,
  DBDeck,
  PublicDeck,
} from "@/lib/db";
import PublicDeckCard from "@/components/PublicDeckCard";
import { useLanguage } from "@/context/LanguageContext";

const gradientBtn: React.CSSProperties = {
  background: "var(--theme-gradient)",
  color: "#fff",
  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
};

const PublishPage = () => {
  const [myDecks, setMyDecks] = useState<DBDeck[]>([]);
  const [publishedDecks, setPublishedDecks] = useState<PublicDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<DBDeck | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const close = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  useEffect(() => {
    Promise.all([getDecks(), getMyPublishedDecks()]).then(([decks, published]) => {
      setMyDecks(decks.filter((d) => !d.source_public_deck_id));
      setPublishedDecks(published);
      setLoading(false);
    });
  }, []);

  const handlePublish = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (!selectedDeck) { setError("Please select a deck."); return; }

    setError("");
    setPublishing(true);

    const { error: pubError } = await publishDeck(
      selectedDeck.id,
      title.trim(),
      description.trim()
    );

    setPublishing(false);

    if (pubError) {
      setError(pubError === "Already published" ? "This deck is already published." : pubError);
      return;
    }

    // Refresh published list
    const updated = await getMyPublishedDecks();
    setPublishedDecks(updated);

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedDeck(null);
    setSuccess(t("publish.success"));
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleUnpublish = async (publicDeckId: string) => {
    await unpublishDeck(publicDeckId);
    setPublishedDecks((prev) => prev.filter((d) => d.id !== publicDeckId));
  };

  const handleDelete = async (publicDeckId: string) => {
    const pub = publishedDecks.find((d) => d.id === publicDeckId);
    if (!pub) return;
    await unpublishDeck(publicDeckId);
    await deleteDeck(pub.deck_id);
    setPublishedDecks((prev) => prev.filter((d) => d.id !== publicDeckId));
    setMyDecks((prev) => prev.filter((d) => d.id !== pub.deck_id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-6 h-6" style={{ color: "var(--theme-primary)" }} />
          <h1 className="text-4xl font-black">{t("publish.title")}</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {t("publish.subtitle")}
        </p>
        <div className="mt-4 h-px w-16" style={{ background: "var(--theme-gradient)" }} />
      </div>

      {/* Publish form */}
      <div
        className="rounded-2xl border p-6 space-y-5 mb-10"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.15)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
        }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--theme-badge-text)" }}>
          {t("publish.new")}
        </h2>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("publish.title_label")} <span className="text-red-500">*</span>
          </label>
          <input
            className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--foreground)",
            }}
            placeholder={t("publish.title_ph")}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--theme-primary)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`; }}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("publish.desc_label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--foreground)",
              minHeight: 90,
            }}
            placeholder={t("publish.desc_ph")}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(""); }}
            maxLength={300}
            onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--theme-primary)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`; }}
          />
          <p className="text-xs text-muted-foreground/40 text-right">{description.length}/300</p>
        </div>

        {/* Deck selector */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("publish.deck_label")} <span className="text-red-500">*</span>
          </label>
          <div className="mt-3 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                borderColor: dropdownOpen ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.2)`,
                color: selectedDeck ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary)" }} />
                {selectedDeck ? selectedDeck.title : t("publish.deck_ph")}
              </div>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden max-h-52 overflow-y-auto"
                style={{
                  backgroundColor: "var(--background)",
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                }}
              >
                {myDecks.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-3">No decks yet.</p>
                ) : (
                  myDecks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => { setSelectedDeck(deck); setDropdownOpen(false); setError(""); }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left text-muted-foreground transition-all"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgb(var(--theme-glow) / 0.08)`;
                        (e.currentTarget as HTMLButtonElement).style.color = `var(--theme-badge-text)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "";
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                        {deck.title}
                      </div>
                      <span className="text-xs text-muted-foreground/50 shrink-0">
                        {deck.cards?.length ?? 0} cards
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <p className="text-sm font-semibold" style={{ color: "var(--theme-badge-text)" }}>
            ✓ {success}
          </p>
        )}

        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
          style={gradientBtn}
        >
          {publishing ? t("publish.publishing") : t("publish.btn")}
        </button>
      </div>

      {/* Published decks list */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
          {t("publish.your_decks")} ({publishedDecks.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border p-5 animate-pulse h-32"
                style={{ borderColor: `rgb(var(--theme-glow) / 0.1)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }} />
            ))}
          </div>
        ) : publishedDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-3xl">🌐</p>
            <p className="font-semibold text-foreground">{t("publish.empty")}</p>
            <p className="text-sm text-muted-foreground">
              {t("publish.empty_sub")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publishedDecks.map((deck) => (
              <PublicDeckCard
                key={deck.id}
                deck={deck}
                isOwn
                onUnpublish={handleUnpublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishPage;