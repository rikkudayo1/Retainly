"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getIncomingChallenges,
  getSentChallenges,
  getChallengeHistory,
  Challenge,
} from "@/lib/db";
import { Terminal, Swords, Clock, Loader2 } from "lucide-react";

type Tab = "incoming" | "sent" | "history";

const SectionRule = ({ label, count }: { label: string; count?: number }) => (
  <div className="flex items-center gap-4 mb-5">
    <span className="text-[10px] font-mono tracking-[0.2em] shrink-0"
      style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
      {label}
    </span>
    {count !== undefined && count > 0 && (
      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
        style={{ backgroundColor: "var(--theme-primary)", color: "#fff" }}>
        {count}
      </span>
    )}
    <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
  </div>
);

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const timeLeft = (expires: string) => {
  const diff = new Date(expires).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

const Avatar = ({ username, avatar }: { username: string; avatar?: string | null }) => (
  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
    {avatar
      ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
      : <div className="w-full h-full flex items-center justify-center font-black text-sm"
          style={{ color: "var(--theme-primary)" }}>
          {username?.[0]?.toUpperCase() ?? "?"}
        </div>
    }
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-10 font-mono">
    <Swords className="w-8 h-8 mx-auto mb-3 opacity-20" />
    <p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>{message}</p>
  </div>
);

const ChallengesPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("incoming");
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [history, setHistory] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const [inc, snt, hist] = await Promise.all([
        getIncomingChallenges(),
        getSentChallenges(),
        getChallengeHistory(),
      ]);
      setIncoming(inc);
      setSent(snt);
      setHistory(hist);
      setLoading(false);
    };
    load();
  }, []);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "incoming", label: "incoming", count: incoming.length },
    { id: "sent",     label: "sent",     count: sent.length },
    { id: "history",  label: "history" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1 { animation-delay: 60ms; }
      `}</style>

      <div className="min-h-screen bg-background text-foreground pb-24">
        <div className="max-w-2xl mx-auto px-5 pt-14 space-y-8">

          {/* Header */}
          <div className="page-enter space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/challenges</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">Challenges</h1>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Accept challenges from friends and track your sent invitations.
            </p>
          </div>

          {/* Tabs */}
          <div className="page-enter stagger-1 flex border rounded-[3px] overflow-hidden"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.12)` }}>
            {tabs.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs transition-all"
                style={{
                  backgroundColor: tab === t.id ? `rgb(var(--theme-glow) / 0.08)` : "transparent",
                  color: tab === t.id ? "var(--theme-badge-text)" : `rgb(var(--theme-glow) / 0.4)`,
                  borderRight: i < tabs.length - 1 ? `1px solid rgb(var(--theme-glow) / 0.1)` : "none",
                  borderBottom: tab === t.id ? `2px solid var(--theme-primary)` : "2px solid transparent",
                }}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--theme-primary)", color: "#fff" }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 font-mono text-xs py-8"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} />
              loading...
            </div>
          ) : (
            <div className="page-enter">

              {/* ── Incoming ── */}
              {tab === "incoming" && (
                <>
                  <SectionRule label="// INCOMING" count={incoming.length} />
                  {incoming.length === 0 ? (
                    <EmptyState message="// no pending challenges" />
                  ) : (
                    <div className="space-y-2.5">
                      {incoming.map((c) => (
                        <button key={c.id} onClick={() => router.push(`/challenges/${c.id}`)}
                          className="w-full text-left rounded-2xl border p-4 transition-all"
                          style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}
                          onMouseEnter={(e) => { (e.currentTarget).style.borderColor = "var(--theme-primary)"; (e.currentTarget).style.backgroundColor = `rgb(var(--theme-glow) / 0.05)`; }}
                          onMouseLeave={(e) => { (e.currentTarget).style.borderColor = `rgb(var(--theme-glow) / 0.15)`; (e.currentTarget).style.backgroundColor = `rgb(var(--theme-glow) / 0.02)`; }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar username={c.challenger_username ?? "?"} avatar={c.challenger_avatar} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm">@{c.challenger_username}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: `rgb(var(--theme-glow) / 0.5)` }}>
                                  challenged you
                                </span>
                              </div>
                              <p className="font-mono text-xs truncate mt-0.5"
                                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                                {c.quiz_title}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-black text-lg" style={{ color: "var(--theme-primary)" }}>
                                {Math.round((c.challenger_score / c.question_count) * 100)}
                                <span className="text-xs font-bold text-muted-foreground">%</span>
                              </div>
                              <p className="font-mono text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>to beat</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
                            <div className="flex items-center gap-1.5 font-mono text-[10px]"
                              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                              <Clock className="w-3 h-3" />
                              {timeLeft(c.expires_at)}
                            </div>
                            <span className="font-mono text-[10px] px-2.5 py-1 rounded-lg"
                              style={{ background: "var(--theme-primary)", color: "#fff" }}>
                              accept →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Sent ── */}
              {tab === "sent" && (
                <>
                  <SectionRule label="// SENT" count={sent.length} />
                  {sent.length === 0 ? (
                    <EmptyState message="// no sent challenges" />
                  ) : (
                    <div className="space-y-2.5">
                      {sent.map((c) => (
                        <div key={c.id}
                          className="rounded-2xl border p-4"
                          style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                          <div className="flex items-center gap-3">
                            <Avatar username={c.challengee_username ?? "?"} avatar={c.challengee_avatar} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm">@{c.challengee_username}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)`, color: `rgb(var(--theme-glow) / 0.4)` }}>
                                  waiting...
                                </span>
                              </div>
                              <p className="font-mono text-xs truncate mt-0.5"
                                style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                                {c.quiz_title}
                              </p>
                            </div>
                            {/* Your score */}
                            <div className="text-right shrink-0">
                              <div className="font-black text-lg" style={{ color: "var(--theme-primary)" }}>
                                {Math.round((c.challenger_score / c.question_count) * 100)}
                                <span className="text-xs font-bold text-muted-foreground">%</span>
                              </div>
                              <p className="font-mono text-[9px]" style={{ color: `rgb(var(--theme-glow) / 0.35)` }}>your score</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.08)` }}>
                            <div className="flex items-center gap-1.5 font-mono text-[10px]"
                              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                              <Clock className="w-3 h-3" />
                              {timeLeft(c.expires_at)}
                            </div>
                            <span className="font-mono text-[10px]"
                              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                              sent {timeAgo(c.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── History ── */}
              {tab === "history" && (
                <>
                  <SectionRule label="// HISTORY" />
                  {history.length === 0 ? (
                    <EmptyState message="// no completed challenges yet" />
                  ) : (
                    <div className="space-y-2.5">
                      {history.map((c) => {
                        const isChallenger = c.challenger_id === currentUserId;
                        const myScore = isChallenger ? c.challenger_score : (c.challengee_score ?? 0);
                        const theirScore = isChallenger ? (c.challengee_score ?? 0) : c.challenger_score;
                        const myPct = Math.round((myScore / c.question_count) * 100);
                        const theirPct = Math.round((theirScore / c.question_count) * 100);
                        const won = myScore > theirScore;
                        const tied = myScore === theirScore;
                        const opponent = isChallenger ? c.challengee_username : c.challenger_username;
                        const opponentAvatar = isChallenger ? c.challengee_avatar : c.challenger_avatar;

                        return (
                          <div key={c.id}
                            className="rounded-2xl border p-4"
                            style={{
                              borderColor: won ? `rgb(var(--theme-glow) / 0.2)` : `rgb(var(--theme-glow) / 0.1)`,
                              backgroundColor: won ? `rgb(var(--theme-glow) / 0.03)` : `rgb(var(--theme-glow) / 0.01)`,
                            }}>
                            <div className="flex items-center gap-3">
                              <Avatar username={opponent ?? "?"} avatar={opponentAvatar} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm">@{opponent}</span>
                                  {won
                                    ? <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: "rgb(34 197 94 / 0.12)", color: "#22c55e" }}>won</span>
                                    : tied
                                      ? <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                          style={{ backgroundColor: "rgb(245 158 11 / 0.12)", color: "#f59e0b" }}>tied</span>
                                      : <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                          style={{ backgroundColor: "rgb(239 68 68 / 0.1)", color: "#ef4444" }}>lost</span>
                                  }
                                </div>
                                <p className="font-mono text-xs truncate mt-0.5"
                                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                                  {c.quiz_title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono text-sm">
                                <span className="font-black" style={{ color: won ? "#22c55e" : "var(--foreground)" }}>{myPct}%</span>
                                <span style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>vs</span>
                                <span className="font-black" style={{ color: `rgb(var(--theme-glow) / 0.5)` }}>{theirPct}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2.5 font-mono text-[10px]"
                              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                              <span>{c.completed_at ? timeAgo(c.completed_at) : ""}</span>
                              <span>{c.question_count} questions</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChallengesPage;