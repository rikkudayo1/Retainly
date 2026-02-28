"use client";

import { useEffect, useState } from "react";
import { Settings, Check } from "lucide-react";
import { getProfile, updateProfileSettings } from "@/lib/db";
import AvatarUpload from "@/components/AvatarUpload";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme, ALL_STYLES, StyleMode } from "@/context/ThemeContext";

const SettingsPage = () => {
  const [username, setUsername] = useState("");
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(
    null,
  );
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const { styleMode, setStyleMode } = useTheme();

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
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (username.trim().length < 3) {
      setError("At least 3 characters.");
      return;
    }
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
      setError(
        saveError === "Username already taken"
          ? "That username is taken."
          : saveError,
      );
      return;
    }

    setOriginalUsername(username.trim());
    setOriginalBio(bio.trim());
    setOriginalAvatarUrl(avatarUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--theme-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground px-6 pt-20 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Settings
            className="w-6 h-6"
            style={{ color: "var(--theme-primary)" }}
          />
          <h1 className="text-4xl font-black">{t("settings.title")}</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-3">
          {t("settings.desc")}
        </p>
        <div
          className="mt-4 h-px w-16"
          style={{ background: "var(--theme-primary)" }}
        />
      </div>

      {/* Profile section */}
      <div
        className="rounded-2xl border p-6 space-y-6"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.15)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
        }}
      >
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--theme-badge-text)" }}
        >
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <AvatarUpload
            currentUrl={avatarUrl}
            onUploaded={(url) => setAvatarUrl(url)}
            size={80}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("settings.avatar")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to upload · PNG, JPG, WebP · Max 2MB
            </p>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("settings.username")}
          </label>
          <div className="relative mt-3">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--theme-primary)" }}
            >
              @
            </span>
            <input
              className="w-full rounded-xl pl-8 pr-4 py-3 text-sm outline-none border transition-all"
              style={{
                backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
                borderColor: error ? "#ef4444" : `rgb(var(--theme-glow) / 0.2)`,
                color: "var(--foreground)",
              }}
              placeholder={t("settings.username_ph")}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              maxLength={20}
              onFocus={(e) => {
                if (!error)
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "var(--theme-primary)";
              }}
              onBlur={(e) => {
                if (!error)
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    `rgb(var(--theme-glow) / 0.2)`;
              }}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {t("settings.bio")}
          </label>
          <textarea
            className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-all"
            style={{
              backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
              borderColor: `rgb(var(--theme-glow) / 0.2)`,
              color: "var(--foreground)",
              minHeight: 100,
            }}
            placeholder={t("settings.bio_ph")}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--theme-primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                `rgb(var(--theme-glow) / 0.2)`;
            }}
          />
          <p className="text-xs text-muted-foreground/40 text-right">
            {bio.length}/160
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40"
          style={
            saved
              ? {
                  backgroundColor: "rgb(34 197 94 / 0.1)",
                  color: "#22c55e",
                  border: "1px solid rgb(34 197 94 / 0.3)",
                }
              : {
                  background: "var(--theme-primary)",
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }
          }
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {t("settings.saved")}
            </span>
          ) : saving ? (
            t("settings.saving")
          ) : (
            t("settings.save")
          )}
        </button>
      </div>

      {/* Style Mode section */}
      <div
        className="mt-4 rounded-2xl border p-6 space-y-5"
        style={{
          borderColor: `rgb(var(--theme-glow) / 0.15)`,
          backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
        }}
      >
        <div>
          <h2
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--theme-badge-text)" }}
          >
            Style Mode
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Changes the overall look and feel of the UI.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ALL_STYLES.map((style) => {
            const isActive = styleMode === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setStyleMode(style.id as StyleMode)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                style={{
                  borderColor: isActive
                    ? "var(--theme-primary)"
                    : `rgb(var(--theme-glow) / 0.15)`,
                  backgroundColor: isActive
                    ? `rgb(var(--theme-glow) / 0.08)`
                    : `rgb(var(--theme-glow) / 0.02)`,
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Emoji preview */}
                <span className="text-2xl">{style.emoji}</span>

                {/* Label */}
                <span
                  className="text-xs font-bold"
                  style={{
                    color: isActive
                      ? "var(--theme-badge-text)"
                      : "var(--muted-foreground)",
                  }}
                >
                  {style.label}
                </span>

                {/* Description */}
                <span className="text-[10px] text-muted-foreground/50 text-center leading-tight">
                  {style.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
