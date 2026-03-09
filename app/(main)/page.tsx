"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Brain,
  Zap,
  BookOpen,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Upload,
  Cpu,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const words_en = ["Retain", "Remember", "Master", "Absorb", "Learn"];
const words_th = ["จดจำ", "ทบทวน", "เชี่ยวชาญ", "ซึมซับ", "เรียนรู้"];

const SectionRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-10">
    <span
      className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.12)` }} />
  </div>
);

const Cursor = () => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="inline-block w-[3px] h-[0.85em] align-middle ml-1 relative top-[-2px]"
      style={{
        backgroundColor: "var(--theme-primary)",
        opacity: on ? 1 : 0,
        transition: "opacity 0.1s",
      }}
    />
  );
};

const HomePage = () => {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const words = lang === "th" ? words_th : words_en;

  // Steps are now built inside the component so t() is available
  const STEPS = [
    { icon: <Upload className="w-4 h-4" />, step: "01", title: t("home.step1.title"), desc: t("home.step1.desc") },
    { icon: <Cpu className="w-4 h-4" />,    step: "02", title: t("home.step2.title"), desc: t("home.step2.desc") },
    { icon: <Trophy className="w-4 h-4" />, step: "03", title: t("home.step3.title"), desc: t("home.step3.desc") },
  ];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );
    sectionRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted]);

  const registerRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
  };

  const isVisible = (id: string) => visibleSections.has(id);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, [words.length]);

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: t("home.feat.summary.title"),
      description: t("home.feat.summary.desc"),
      href: "/summary",
      tag: "// AI",
      primary: true,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t("home.feat.quiz.title"),
      description: t("home.feat.quiz.desc"),
      href: "/quiz",
      tag: "// QUIZ",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: t("home.feat.aichat.title"),
      description: t("home.feat.aichat.desc"),
      href: "/chat",
      tag: "// CHAT",
    },
    {
      icon: <LayoutGrid className="w-5 h-5" />,
      title: t("home.feat.flash.title"),
      description: t("home.feat.flash.desc"),
      href: "/flashcards",
      tag: "// CARDS",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: t("home.feat.library.title"),
      description: t("home.feat.library.desc"),
      href: "/upload",
      tag: "// FILES",
    },
  ];

  const primaryFeature = features[0];
  const secondaryFeatures = features.slice(1);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(16px);
        }
        .reveal.visible {
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgb(var(--theme-glow) / 0);
          transition: background 0.2s ease;
          pointer-events: none;
        }
        .feature-card:hover::before {
          background: rgb(var(--theme-glow) / 0.04);
        }
        .noise-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
        }
      `}</style>

      <div className="noise-bg" />

      {/* Top bloom */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at top, rgb(var(--theme-glow) / 0.07) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 min-h-screen bg-background text-foreground">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-32">

          {/* ── Hero ──────────────────────────────────────── */}
          <section
            id="hero"
            ref={registerRef("hero")}
            className={`reveal mb-20 ${isVisible("hero") ? "visible" : ""}`}
          >
            <div
              className="flex items-center gap-2 mb-8 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
            >
              <Brain className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly</span>
              <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>—</span>
              <span>{t("home.badge")}</span>
            </div>

            <h1 className="text-6xl sm:text-4xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8">
              <span
                className="block transition-all duration-300"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(-10px)",
                  color: "var(--theme-primary)",
                }}
              >
                {words[wordIndex]}
                <Cursor />
              </span>
              <span className="block text-foreground">{t("home.tagline")}</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-lg leading-relaxed mb-10">
              {t("home.sub")}
            </p>

            <div className="flex items-center gap-3">
              <Button
                size="lg"
                className="px-7 font-mono rounded-[3px] hover:opacity-90 transition-opacity"
                style={{
                  background: "var(--theme-primary)",
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}
                onClick={() => router.push("/upload")}
              >
                {t("home.cta")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-lg px-7 font-mono text-sm hover:opacity-80 transition-opacity"
                style={{ color: "var(--theme-badge-text)" }}
                onClick={() => router.push("/summary")}
              >
                {t("home.try")} →
              </Button>
            </div>
          </section>

          {/* ── Stats terminal readout ─────────────────────── */}
          <section
            id="stats"
            ref={registerRef("stats")}
            className={`reveal mb-20 ${isVisible("stats") ? "visible" : ""}`}
            style={{ animationDelay: "60ms" }}
          >
            <div
              className="flex flex-wrap items-center gap-6 py-4 px-6 rounded-xl border font-mono text-sm"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.12)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.025)`,
              }}
            >
              <span style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>$</span>
              <div className="flex items-center gap-2">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>tools</span>
                <span className="font-bold text-foreground">5</span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-2">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>engine</span>
                <span className="font-bold" style={{ color: "var(--theme-primary)" }}>AI</span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-2">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>flashcards</span>
                <span className="font-bold text-foreground">∞</span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.15)` }} />
              <div className="flex items-center gap-2">
                <span style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-bold">READY</span>
                </span>
              </div>
            </div>
          </section>

          {/* ── How it works ──────────────────────────────── */}
          <section
            id="steps"
            ref={registerRef("steps")}
            className={`reveal mb-20 ${isVisible("steps") ? "visible" : ""}`}
            style={{ animationDelay: "120ms" }}
          >
            <SectionRule label={t("home.steps.label")} />
            <div className="grid grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={i} className="relative">
                  {i < STEPS.length - 1 && (
                    <div
                      className="hidden md:block absolute top-5 left-full w-6 h-px z-10"
                      style={{ background: `linear-gradient(to right, rgb(var(--theme-glow) / 0.3), transparent)` }}
                    />
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-mono text-[10px] tracking-widest"
                      style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                    >
                      {step.step}
                    </span>
                    <div
                      className="p-2 rounded-lg border"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.18)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                        color: "var(--theme-badge-text)",
                      }}
                    >
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ──────────────────────────────────── */}
          <section
            id="features"
            ref={registerRef("features")}
            className={`reveal ${isVisible("features") ? "visible" : ""}`}
            style={{ animationDelay: "180ms" }}
          >
            <SectionRule label={t("home.features.label")} />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Primary — 2 cols, tall */}
              <button
                onClick={() => router.push(primaryFeature.href)}
                className="feature-card relative group text-left rounded-2xl p-7 border md:col-span-2 flex flex-col justify-between min-h-[260px]"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                }}
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.2)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                        color: "var(--theme-badge-text)",
                      }}
                    >
                      {primaryFeature.icon}
                    </div>
                    <span
                      className="font-mono text-[10px] tracking-widest"
                      style={{ color: `rgb(var(--theme-glow) / 0.35)` }}
                    >
                      {primaryFeature.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-2xl text-foreground mb-2 leading-tight">
                    {primaryFeature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {primaryFeature.description}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 mt-6 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                  style={{ color: "var(--theme-primary)" }}
                >
                  Open <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Secondary — 2×2 spanning 3 cols */}
              <div className="md:col-span-3 grid grid-cols-2 gap-4">
                {secondaryFeatures.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(f.href)}
                    className="feature-card relative group text-left rounded-2xl p-5 border flex flex-col justify-between min-h-[120px]"
                    style={{
                      borderColor: `rgb(var(--theme-glow) / 0.15)`,
                      backgroundColor: "var(--background)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="p-2 rounded-lg border"
                        style={{
                          borderColor: `rgb(var(--theme-glow) / 0.18)`,
                          backgroundColor: `rgb(var(--theme-glow) / 0.06)`,
                          color: "var(--theme-badge-text)",
                        }}
                      >
                        {f.icon}
                      </div>
                      <span
                        className="font-mono text-[9px] tracking-widest"
                        style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
                      >
                        {f.tag}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground mb-1">{f.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {f.description}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-3.5 h-3.5 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-1 group-hover:translate-x-0"
                      style={{ color: "var(--theme-primary)" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────── */}
          <div className="mt-24 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            <span
              className="font-mono text-[10px] tracking-[0.25em]"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
            >
              {t("home.footer1")}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
          </div>

        </div>
      </div>
    </>
  );
};

export default HomePage;