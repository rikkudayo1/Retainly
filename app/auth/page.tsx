"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { Brain, Github, Mail, Eye, EyeOff } from "lucide-react";

const AuthPage = () => {
  const { t } = useLanguage();
  const supabase = createClient();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleOAuth = async (provider: "github" | "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const handleEmail = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError(""); setSuccess(""); setLoading(true);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) setError(error.message);
        else setSuccess("Check your email to confirm your account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const gradientBtn: React.CSSProperties = {
    background: "var(--theme-gradient)",
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: `rgb(var(--theme-glow) / 0.1)` }}>
            <Brain className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
          </div>
          <h1 className="text-3xl font-black">Retainly</h1>
          <p className="text-sm text-muted-foreground">Sign in to sync your study data across devices.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-6 space-y-4"
          style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.03)` }}>

          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.15)` }}>
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className="flex-1 py-2 text-sm font-semibold transition-all"
                style={tab === t
                  ? { background: "var(--theme-gradient)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }
                  : { color: "var(--muted-foreground)" }}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2">
            <button onClick={() => handleOAuth("github")}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:brightness-110"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
              <Github className="w-4 h-4" />
              Continue with GitHub
            </button>
            <button onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:brightness-110"
              style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, backgroundColor: `rgb(var(--theme-glow) / 0.04)` }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
          </div>

          {/* Email + Password */}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)`, borderColor: `rgb(var(--theme-glow) / 0.2)` }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`; }}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEmail(); }}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all pr-10"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.04)`, borderColor: `rgb(var(--theme-glow) / 0.2)` }}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--theme-primary)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = `rgb(var(--theme-glow) / 0.2)`; }}
              />
              <button onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm" style={{ color: "var(--theme-badge-text)" }}>{success}</p>}

          <button onClick={handleEmail} disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover:brightness-110"
            style={gradientBtn}>
            {loading ? "Loading..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/50">
          Your data syncs across all your devices.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;