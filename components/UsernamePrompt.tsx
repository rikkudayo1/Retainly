"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { updateProfileSettings } from "@/lib/db";

interface UsernamePromptProps {
  onComplete: () => void;
}

const UsernamePrompt = ({ onComplete }: UsernamePromptProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) { setError("Username is required."); return; }
    if (trimmed.length < 3) { setError("At least 3 characters."); return; }
    if (trimmed.length > 20) { setError("Max 20 characters."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Only letters, numbers and underscores.");
      return;
    }

    setError("");
    setLoading(true);
    const { error: saveError } = await updateProfileSettings({ username: trimmed });
    setLoading(false);

    if (saveError) {
      setError(saveError === "Username already taken" ? "That username is taken." : saveError);
      return;
    }

    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{
          backgroundColor: "var(--background)",
          border: `1px solid rgb(var(--theme-glow) / 0.2)`,
          boxShadow: `0 0 80px rgb(var(--theme-glow) / 0.12)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Welcome header */}
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <Brain className="w-8 h-8" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Welcome to Retainly!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a username to get started. You can always change it later in settings.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Username
          </label>
          <div className="relative">
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
              placeholder="yourname"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              onFocus={(e) => {
                if (!error) (e.currentTarget as HTMLInputElement).style.borderColor = "var(--theme-primary)";
              }}
              onBlur={(e) => {
                if (!error) (e.currentTarget as HTMLInputElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`;
              }}
              maxLength={20}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground/50">
            Letters, numbers, underscores only · 3–20 characters
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !username.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
          style={{
            background: "var(--theme-gradient)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {loading ? "Saving..." : "Let's Go 🚀"}
        </button>
      </div>
    </div>
  );
};

export default UsernamePrompt;