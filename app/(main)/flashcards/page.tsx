"use client";

import { useEffect, useState } from "react";
import { LayersIcon, LayoutGrid, FileText, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getFiles, getDecks, saveDeck, DBFile } from "@/lib/db";

const gradientBtn: React.CSSProperties = {
  background: "var(--theme-gradient)",
  color: "#fff",
  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
};

const FlashcardsPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [storedFiles, setStoredFiles] = useState<DBFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DBFile | null>(null);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckCount, setDeckCount] = useState(0);

  // Load files and deck count from Supabase on mount
  useEffect(() => {
    Promise.all([getFiles(), getDecks()]).then(([files, decks]) => {
      setStoredFiles(files);
      setDeckCount(decks.length);
      setLoadingFiles(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setFileDropdownOpen(false);
    if (fileDropdownOpen)
      document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fileDropdownOpen]);

  const handleGenerate = async () => {
    const inputText = selectedFile ? selectedFile.text : pastedText;
    if (!inputText.trim()) {
      setError(t("flash.error.empty"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("text", inputText);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const rawCards = data.output.flashcards as {
          keyword: string;
          hint: string;
          explanation: string;
        }[];

        const title = deckTitle.trim() || selectedFile?.name || "Untitled Deck";
        const newDeck = await saveDeck(title, rawCards);

        if (!newDeck) {
          setError(t("flash.error.failed"));
          return;
        }

        router.push(`/flashcards/study?id=${newDeck.id}`);
      } else {
        setError(data.error || t("flash.error.failed"));
      }
    } catch (err: any) {
      setError(err.message || t("flash.error.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background text-foreground">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <LayoutGrid
              className="w-7 h-7"
              style={{ color: "var(--theme-primary)" }}
            />
          </div>
          <h1 className="text-3xl font-black">{t("flash.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("flash.subtitle")}</p>
        </div>

        {/* Deck name */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("flash.deck_name")}
          </label>
          <input
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--foreground)",
            }}
            placeholder={t("flash.deck_ph")}
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--theme-primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.2)`;
            }}
          />
        </div>

        {/* File dropdown — skeleton while loading */}
        {loadingFiles ? (
          <div
            className="h-12 rounded-xl animate-pulse"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.06)` }}
          />
        ) : (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
              {t("flash.library")}
            </label>
            <div className="relative mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setFileDropdownOpen((p) => !p)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all"
                style={{
                  backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                  borderColor: fileDropdownOpen
                    ? "var(--theme-primary)"
                    : `rgb(var(--theme-glow) / 0.2)`,
                  color: selectedFile
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--theme-primary)" }}
                  />
                  {selectedFile ? selectedFile.name : t("quiz.choose")}
                </div>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{
                    transform: fileDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                />
              </button>

              {fileDropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--background)",
                    borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  }}
                >
                  {storedFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-3">
                      No files uploaded yet.
                    </p>
                  ) : (
                    storedFiles.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFile(f);
                          setPastedText("");
                          setFileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-muted-foreground transition-all"
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor =
                            `rgb(var(--theme-glow) / 0.08)`;
                          (e.currentTarget as HTMLButtonElement).style.color =
                            `var(--theme-badge-text)`;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "";
                        }}
                      >
                        <FileText
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "var(--theme-primary)" }}
                        />
                        {f.name}
                        {selectedFile?.id === f.id && (
                          <span
                            className="ml-auto text-xs"
                            style={{ color: "var(--theme-primary)" }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }}
          />
          <span className="text-xs text-muted-foreground">or</span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }}
          />
        </div>

        {/* Text input */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("flash.paste")}
          </label>
          <textarea
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[140px] border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
            }}
            placeholder={t("flash.placeholder")}
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              if (e.target.value) setSelectedFile(null);
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--theme-primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.2)`;
            }}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:brightness-110"
          style={gradientBtn}
        >
          {loading ? t("flash.generating") : t("flash.generate")}
        </button>

        {/* View decks link */}
        {deckCount > 0 && (
          <button
            onClick={() => router.push("/flashcards/decks")}
            className="w-full text-sm flex items-center justify-center gap-2 py-2 rounded-xl border transition-all text-muted-foreground"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                `rgb(var(--theme-glow) / 0.06)`;
              (e.currentTarget as HTMLButtonElement).style.color =
                `var(--theme-badge-text)`;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.15)`;
            }}
          >
            <LayersIcon
              className="w-4 h-4"
              style={{ color: "var(--theme-primary)" }}
            />
            {t("flash.view_decks")} ({deckCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
