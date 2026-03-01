"use client";

import { useEffect, useState } from "react";
import { Check, Terminal, User, AtSign, FileText } from "lucide-react";
import { getProfile, updateProfileSettings } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import { useLanguage } from "@/context/LanguageContext";

const SettingsPage = () => {
  const [username, setUsername] = useState("");
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    getProfile().then((profile) => {
      if (!profile) return;
      const p = profile as any;
      setUsername(p.username ?? "");
      setBio(p.bio ?? "");
      setAvatarUrl(p.avatar_url ?? null);
      setOriginalAvatarUrl(p.avatar_url ?? null);
      setOriginalUsername(p.username ?? "");
      setOriginalBio(p.bio ?? "");
      setLoading(false);
    });
  }, []);

  const hasChanges =
    username !== originalUsername ||
    bio !== originalBio ||
    avatarUrl !== originalAvatarUrl;

  const handleSave = async () => {
    if (!username.trim()) { setError("Username is required."); return; }
    if (username.trim().length < 3) { setError("At least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Only letters, numbers and underscores.");
      return;
    }

    setError("");
    setSaving(true);
    const { error: saveError } = await updateProfileSettings({
      username: username.trim(),
      bio: bio.trim(),
    });
    setSaving(false);

    if (saveError) {
      setError(saveError === "Username already taken" ? "That username is taken." : saveError);
      return;
    }

    setOriginalUsername(username.trim());
    setOriginalBio(bio.trim());
    setOriginalAvatarUrl(avatarUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // Notify sidebar to update profile link immediately
    window.dispatchEvent(new CustomEvent("username-updated", { detail: username.trim() }));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes savedIn {
          0%   { opacity: 0; transform: scale(0.92); }
          60%  { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .card-enter  { opacity: 0; animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .saved-enter { animation: savedIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }

        .field-input {
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .field-input:focus {
          border-color: var(--theme-primary) !important;
          background-color: rgb(var(--theme-glow) / 0.05) !important;
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-xl mx-auto px-5 pt-14 pb-24">

          {/* ── Header ──────────────────────────────────── */}
          <div className="page-enter mb-10 space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/settings</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("settings.desc")}
            </p>
          </div>

          {/* ── Profile card ────────────────────────────── */}
          <div
            className="card-enter rounded-2xl border overflow-hidden"
            style={{
              animationDelay: "60ms",
              borderColor: `rgb(var(--theme-glow) / 0.15)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            {/* Card titlebar */}
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 border-b"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.1)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-400/50" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/50" />
              <span className="w-2 h-2 rounded-full bg-green-400/50" />
              <span className="ml-3 font-mono text-[10px]"
                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                profile.sh
              </span>
            </div>

            <div className="p-6 space-y-7">

              {/* ── Avatar row ── */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    onUploaded={(url) => setAvatarUrl(url)}
                    size={72}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--theme-primary)" }} />
                    <span className="font-semibold text-sm text-foreground">
                      {t("settings.avatar")}
                    </span>
                  </div>
                  <p className="font-mono text-[11px]"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                    // PNG, JPG, WebP · max 2MB
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />

              {/* ── Username ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-3.5 h-3.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                    <label className="font-mono text-[11px] tracking-wide"
                      style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
                      {t("settings.username")}
                    </label>
                  </div>
                  <span className="font-mono text-[10px]"
                    style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                    {username.length}/20
                  </span>
                </div>

                {/* Input with prompt prefix */}
                <div
                  className="flex items-center rounded-xl border overflow-hidden field-input"
                  style={{
                    borderColor: error ? "#ef4444" : `rgb(var(--theme-glow) / 0.18)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  }}
                >
                  <div
                    className="px-3 py-3 border-r font-mono text-xs shrink-0"
                    style={{
                      borderColor: error ? "#ef4444" : `rgb(var(--theme-glow) / 0.1)`,
                      color: "var(--theme-primary)",
                      backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                    }}
                  >
                    @
                  </div>
                  <input
                    className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
                    style={{ color: "var(--foreground)" }}
                    placeholder={t("settings.username_ph")}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    maxLength={20}
                  />
                </div>

                {error && (
                  <p className="font-mono text-[11px]" style={{ color: "#ef4444" }}>
                    // {error}
                  </p>
                )}
              </div>

              {/* ── Bio ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" style={{ color: `rgb(var(--theme-glow) / 0.4)` }} />
                    <label className="font-mono text-[11px] tracking-wide"
                      style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>
                      {t("settings.bio")}
                    </label>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, color: `rgb(var(--theme-glow) / 0.35)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
                      markdown
                    </span>
                  </div>
                  <span className="font-mono text-[10px]"
                    style={{
                      color: bio.length > 270
                        ? "#f59e0b"
                        : `rgb(var(--theme-glow) / 0.3)`,
                    }}>
                    {bio.length}/300
                  </span>
                </div>

                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}
                >
                  {/* Textarea prompt header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 border-b font-mono text-[10px]"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.08)`,
                      backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                      color: `rgb(var(--theme-glow) / 0.35)`,
                    }}
                  >
                    <span style={{ color: "var(--theme-primary)" }}>$</span>
                    <span>bio.txt</span>
                  </div>
                  <textarea
                    className="field-input w-full resize-none px-4 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground/30 leading-relaxed border-none"
                    style={{ color: "var(--foreground)", minHeight: 100 }}
                    placeholder={"Write your bio...\nSupports **bold**, *italic*, `code`, # headings"}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </div>

              {/* ── Save button ── */}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-35 flex items-center justify-center gap-2"
                style={
                  saved
                    ? { backgroundColor: "rgb(34 197 94 / 0.1)", color: "#22c55e", border: "1px solid rgb(34 197 94 / 0.25)" }
                    : { background: "var(--theme-primary)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                }
              >
                {saved ? (
                  <span className="saved-enter flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="font-mono text-xs">{t("settings.saved")}</span>
                  </span>
                ) : saving ? (
                  <span className="font-mono text-xs">{t("settings.saving")}...</span>
                ) : (
                  t("settings.save")
                )}
              </button>

              {/* Unsaved changes indicator */}
              {hasChanges && !saved && (
                <p className="font-mono text-[10px] text-center"
                  style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>
                  // unsaved changes
                </p>
              )}

            </div>
          </div>

          {/* ── Footer ornament ─────────────────────────── */}
          <div className="mt-16 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
            <span className="font-mono text-[10px] tracking-[0.25em]"
              style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>
              ~/settings
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }} />
          </div>

        </div>
      </div>
    </>
  );
};

export default SettingsPage;