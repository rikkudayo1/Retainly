"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain,
  Zap,
  BookOpen,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const words_en = ["Retain", "Remember", "Master", "Absorb", "Learn"];
const words_th = ["จดจำ", "ทบทวน", "เชี่ยวชาญ", "ซึมซับ", "เรียนรู้"];

const HomePage = () => {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const words = lang === "th" ? words_th : words_en;

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 400);
    }, 2200);
    return () => clearInterval(interval);
  }, [words.length]);

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: t("home.feat.summary.title"),
      description: t("home.feat.summary.desc"),
      href: "/summary",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t("home.feat.quiz.title"),
      description: t("home.feat.quiz.desc"),
      href: "/quiz",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: t("home.feat.aichat.title"),
      description: t("home.feat.aichat.desc"),
      href: "/chat",
    },
    {
      icon: <LayoutGrid className="w-5 h-5" />,
      title: t("home.feat.flash.title"),
      description: t("home.feat.flash.desc"),
      href: "/flashcards",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: t("home.feat.library.title"),
      description: t("home.feat.library.desc"),
      href: "/upload",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32">
        <div className="flex justify-center mb-10">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs backdrop-blur-sm"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.3)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
              color: "var(--theme-badge-text)",
            }}
          >
            <Brain
              className="w-3.5 h-3.5"
              style={{ color: "var(--theme-primary)" }}
            />
            {t("home.badge")}
          </div>
        </div>

        <div className="text-center space-y-6 mb-24">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
            <span
              className="inline-block transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-12px)",
              }}
            >
              <span
                className="bg-clip-text"
                style={{ color: `var(--theme-primary)` }}
              >
                {words[wordIndex]}
              </span>
            </span>
            <br />
            <span className="text-foreground">{t("home.tagline")}</span>
          </h1>

          <div className="flex items-center justify-center gap-3">
            <div
              className="h-px w-16"
              style={{
                background: `linear-gradient(to right, transparent, rgb(var(--theme-glow) / 0.6))`,
              }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.6)` }}
            />
            <div
              className="h-px w-16"
              style={{
                background: `linear-gradient(to left, transparent, rgb(var(--theme-glow) / 0.6))`,
              }}
            />
          </div>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("home.sub")}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="rounded-full px-8 font-semibold hover:opacity-90 transition-opacity"
              style={{
                background: "var(--theme-primary)",
                color: "#fff",
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
              onClick={() => router.push("/upload")}
            >
              {t("home.cta")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 hover:opacity-80 transition-opacity"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.4)`,
                color: "var(--theme-badge-text)",
              }}
              onClick={() => router.push("/summary")}
            >
              {t("home.try")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <button
              key={i}
              onClick={() => router.push(f.href)}
              className="group text-left rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200 border"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.2)`,
                backgroundColor: "var(--background)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="rounded-xl p-2.5 border"
                  style={{
                    color: "var(--theme-badge-text)",
                    borderColor: `rgb(var(--theme-glow) / 0.2)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                  }}
                >
                  {f.icon}
                </div>

                <ArrowRight
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 
                     transition-all -translate-x-1 group-hover:translate-x-0 duration-200"
                  style={{ color: "var(--theme-primary)" }}
                />
              </div>

              <h3 className="font-bold text-lg mb-1 text-foreground">
                {f.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </button>
          ))}
        </div>

        <div className="text-center mt-24 space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="h-px w-12"
              style={{
                background: `linear-gradient(to right, transparent, rgb(var(--theme-glow) / 0.4))`,
              }}
            />
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: `rgb(var(--theme-glow) / 0.4)` }}
            />
            <div
              className="h-px w-12"
              style={{
                background: `linear-gradient(to left, transparent, rgb(var(--theme-glow) / 0.4))`,
              }}
            />
          </div>
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: `rgb(var(--theme-glow) / 0.5)` }}
          >
            {t("home.footer1")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;