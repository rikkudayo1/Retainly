"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { Brain, Github, Eye, EyeOff, Terminal } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");

  const tagline = "// your second brain for studying";

  useEffect(() => {
    setMounted(true);
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(tagline.slice(0, i + 1));
      i++;
      if (i >= tagline.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const handleOAuth = async (provider: "github" | "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const handleEmail = async () => {
    if (!email || !password) {
      setError("// missing required fields");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(`// error: ${error.message}`);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) setError(`// error: ${error.message}`);
        else setSuccess("// success: check your email to confirm your account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 relative overflow-hidden">
      {/* Noise texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Grid lines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.03,
          backgroundImage: `linear-gradient(rgb(var(--theme-glow)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--theme-glow)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .auth-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        .auth-enter-1 { animation: fadeUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        .auth-enter-2 { animation: fadeUp 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        .cursor { animation: blink 1s step-end infinite; }
        .input-field {
          width: 100%;
          padding: 10px 16px;
          font-size: 0.875rem;
          outline: none;
          border-radius: 0.75rem;
          border: 1px solid rgb(var(--theme-glow) / 0.18);
          background: rgb(var(--theme-glow) / 0.04);
          color: var(--foreground);
          transition: border-color 0.15s ease;
          font-family: 'Courier New', monospace;
        }
        .input-field::placeholder { color: rgb(var(--theme-glow) / 0.3); font-family: 'Courier New', monospace; }
        .input-field:focus { border-color: var(--theme-primary); }
        .oauth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 0.75rem;
          border: 1px solid rgb(var(--theme-glow) / 0.18);
          background: rgb(var(--theme-glow) / 0.03);
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: 'Courier New', monospace;
          transition: all 0.15s ease;
          color: var(--foreground);
        }
        .oauth-btn:hover {
          border-color: rgb(var(--theme-glow) / 0.35);
          background: rgb(var(--theme-glow) / 0.08);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo + tagline */}
        <div className="auth-enter space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `rgb(var(--theme-glow) / 0.1)`,
                border: `1px solid rgb(var(--theme-glow) / 0.2)`,
              }}
            >
              <Brain
                className="w-5 h-5"
                style={{ color: "var(--theme-primary)" }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                Retainly
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Terminal
                  className="w-2.5 h-2.5 shrink-0"
                  style={{ color: "var(--theme-primary)" }}
                />
                <span
                  className="font-mono text-[10px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
                >
                  {typedText}
                  <span
                    className="cursor"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    ▊
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          className="auth-enter-1 rounded-2xl border overflow-hidden"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.18)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
          }}
        >
          {/* Titlebar */}
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
            <span
              className="ml-3 font-mono text-[10px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              {tab === "login" ? "auth/signin.sh" : "auth/signup.sh"}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Tab switcher */}
            <div
              className="flex rounded-xl overflow-hidden border p-0.5 gap-0.5"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.15)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
              }}
            >
              {(["login", "signup"] as const).map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => {
                    setTab(tabId);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 py-2 text-xs font-bold font-mono rounded-lg transition-all"
                  style={
                    tab === tabId
                      ? { background: "var(--theme-primary)", color: "#fff" }
                      : { color: `rgb(var(--theme-glow) / 0.5)` }
                  }
                >
                  {tabId === "login" ? "sign_in" : "sign_up"}
                </button>
              ))}
            </div>

            {/* OAuth */}
            <div className="space-y-2">
              <button
                onClick={() => handleOAuth("github")}
                className="oauth-btn"
              >
                <Github className="w-4 h-4" />
                continue_with_github
              </button>
              <button
                onClick={() => handleOAuth("google")}
                className="oauth-btn"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                continue_with_google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }}
              />
              <span
                className="font-mono text-[10px]"
                style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
              >
                // or
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }}
              />
            </div>

            {/* Fields */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label
                  className="font-mono text-[10px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                >
                  // email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field mt-2"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="font-mono text-[10px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                >
                  // password
                </label>
                <div className="relative flex items-center mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEmail();
                    }}
                    className="input-field"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 transition-opacity hover:opacity-70"
                    style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error / success */}
            {error && (
              <p className="font-mono text-xs" style={{ color: "#ef4444" }}>
                {error}
              </p>
            )}
            {success && (
              <p
                className="font-mono text-xs"
                style={{ color: "var(--theme-badge-text)" }}
              >
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleEmail}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm font-mono transition-all disabled:opacity-40 hover:brightness-110"
              style={{ background: "var(--theme-primary)", color: "#fff" }}
            >
              {loading ? "loading..." : tab === "login" ? "sign-in" : "sign-up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          className="auth-enter-2 text-center font-mono text-[10px]"
          style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
        >
          // data syncs across all your devices
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
