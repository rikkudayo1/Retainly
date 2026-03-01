"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, LeaderboardEntry } from "@/lib/db";
import { createClient } from "@/lib/supabase";
import { Terminal, Gem } from "lucide-react";

type Tab = "weekly" | "alltime";

function formatPoints(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

// Bar widths for rank list (percentage of max)
const getBarWidth = (points: number, max: number) =>
  max === 0 ? 0 : Math.max(4, Math.round((points / max) * 100));

const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#94a3b8",
  3: "#b45309",
};

const getRankColor = (rank: number) =>
  RANK_COLORS[rank] ?? null;

const LeaderboardPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) =>
      setCurrentUserId(data.user?.id ?? null)
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    setEntries([]);
    getLeaderboard(tab).then((data) => {
      setEntries(data);
      setLoading(false);
      setAnimKey((k) => k + 1);
    });
  }, [tab]);

  const myRank = currentUserId
    ? entries.findIndex((e) => e.user_id === currentUserId) + 1
    : null;

  const maxPoints = entries[0]?.points ?? 0;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0; }
          to   { width: var(--bar-w); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .row-enter   { opacity: 0; animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        .bar-grow    { animation: barGrow 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .skeleton {
          background: linear-gradient(90deg, rgb(var(--theme-glow)/0.06) 0%, rgb(var(--theme-glow)/0.1) 50%, rgb(var(--theme-glow)/0.06) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        .rank-row {
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .rank-row:hover {
          background-color: rgb(var(--theme-glow) / 0.06) !important;
          border-color: rgb(var(--theme-glow) / 0.22) !important;
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-2xl mx-auto px-5 pt-14 pb-24">

          {/* ── Header ──────────────────────────────────── */}
          <div className="page-enter mb-10 space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/leaderboard</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Points are earned from every study session · 1 activity = 100 pts
            </p>

            {/* My rank badge */}
            {myRank && myRank > 0 && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs"
                style={{
                  borderColor: `rgb(var(--theme-glow) / 0.2)`,
                  backgroundColor: `rgb(var(--theme-glow) / 0.05)`,
                  color: "var(--theme-badge-text)",
                }}
              >
                <span style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>your rank</span>
                <span className="font-bold" style={{ color: "var(--theme-primary)" }}>
                  #{myRank}
                </span>
                <span style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  this {tab === "weekly" ? "week" : "time"}
                </span>
              </div>
            )}
          </div>

          {/* ── Tab toggle ──────────────────────────────── */}
          <div
            className="page-enter flex border rounded-xl overflow-hidden mb-8"
            style={{
              animationDelay: "40ms",
              borderColor: `rgb(var(--theme-glow) / 0.12)`,
            }}
          >
            {(["weekly", "alltime"] as Tab[]).map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 font-mono text-xs tracking-wide transition-all duration-150"
                style={{
                  backgroundColor: tab === t ? `rgb(var(--theme-glow) / 0.1)` : "transparent",
                  color: tab === t ? "var(--theme-badge-text)" : `rgb(var(--theme-glow) / 0.4)`,
                  borderBottom: tab === t ? "2px solid var(--theme-primary)" : "2px solid transparent",
                  borderRight: i === 0 ? `1px solid rgb(var(--theme-glow) / 0.1)` : "none",
                }}
              >
                {t === "weekly" ? "this_week" : "all_time"}
              </button>
            ))}
          </div>

          {/* ── Podium (top 3) ──────────────────────────── */}
          {!loading && entries.length >= 1 && (() => {
            // Ordered: 2nd | 1st | 3rd
            const podium = [
              { entry: entries[1] ?? null, rank: 2, height: 88 },
              { entry: entries[0] ?? null, rank: 1, height: 120 },
              { entry: entries[2] ?? null, rank: 3, height: 64 },
            ];

            return (
              <div
                className="page-enter flex items-end justify-center gap-2 mb-10"
                style={{ animationDelay: "80ms" }}
              >
                {podium.map(({ entry, rank, height }, idx) => {
                  const color = getRankColor(rank);
                  const isMe = entry?.user_id === currentUserId;
                  const avatarSize = rank === 1 ? 56 : 44;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2" style={{ flex: "1 1 0", maxWidth: 160 }}>

                      {/* Avatar + label above bar */}
                      {entry ? (
                        <button
                          className="flex flex-col items-center gap-1.5 group"
                          onClick={() => router.push(`/profile/${entry.username}`)}
                        >
                          <div
                            className="rounded-full overflow-hidden border-2 transition-transform group-hover:scale-105"
                            style={{
                              width: avatarSize,
                              height: avatarSize,
                              borderColor: color ?? `rgb(var(--theme-glow) / 0.3)`,
                              boxShadow: rank === 1 ? `0 0 16px ${color}55` : "none",
                            }}
                          >
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-sm"
                                style={{ backgroundColor: `${color ?? "#888"}22`, color: color ?? "var(--theme-primary)" }}>
                                {entry.username[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <p className="font-mono text-[11px] font-bold text-center truncate w-full px-1"
                            style={{ color: isMe ? "var(--theme-primary)" : `rgb(var(--theme-glow) / 0.7)` }}>
                            {isMe ? "you" : entry.username}
                          </p>
                          <div className="flex items-center gap-1">
                            <Gem className="w-2.5 h-2.5" style={{ color: color ?? `rgb(var(--theme-glow) / 0.5)` }} />
                            <span className="font-mono text-[11px] font-black"
                              style={{ color: color ?? `rgb(var(--theme-glow) / 0.6)` }}>
                              {formatPoints(entry.points)}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div style={{ width: avatarSize, height: avatarSize }} />
                      )}

                      {/* Bar */}
                      <div
                        className="w-full flex items-center justify-center relative"
                        style={{
                          height,
                          backgroundColor: entry ? `${color ?? "#888"}15` : `rgb(var(--theme-glow) / 0.03)`,
                          borderTop: entry ? `2px solid ${color ?? "transparent"}` : `2px solid rgb(var(--theme-glow) / 0.08)`,
                          borderLeft: `1px solid ${entry ? (color ?? "#888") + "30" : `rgb(var(--theme-glow) / 0.06)`}`,
                          borderRight: `1px solid ${entry ? (color ?? "#888") + "30" : `rgb(var(--theme-glow) / 0.06)`}`,
                        }}
                      >
                        <span
                          className="font-mono text-xs font-black absolute top-3"
                          style={{ color: color ?? `rgb(var(--theme-glow) / 0.3)` }}
                        >
                          {rank === 1 ? "01" : rank === 2 ? "02" : "03"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── Section rule ────────────────────────────── */}
          <div
            className="page-enter flex items-center gap-4 mb-5"
            style={{ animationDelay: "100ms" }}
          >
            <span className="font-mono text-[10px] tracking-[0.2em] shrink-0"
              style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
              // RANKINGS
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            {!loading && entries.length > 0 && (
              <span className="font-mono text-[10px] shrink-0"
                style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                {entries.length} entries
              </span>
            )}
          </div>

          {/* ── Column headers ──────────────────────────── */}
          {!loading && entries.length > 0 && (
            <div
              className="flex items-center gap-4 px-4 mb-2 font-mono text-[10px] tracking-widest"
              style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
            >
              <span className="w-7 text-center shrink-0">#</span>
              <span className="flex-1">USER</span>
              <span className="w-32 hidden sm:block">ACTIVITY</span>
              <span className="w-16 text-right">PTS</span>
            </div>
          )}

          {/* ── Rank list ───────────────────────────────── */}
          <div className="space-y-1.5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton" style={{ animationDelay: `${i * 60}ms` }} />
                ))
              : entries.map((entry, i) => {
                  const rank = i + 1;
                  const isMe = entry.user_id === currentUserId;
                  const rankColor = getRankColor(rank);
                  const barW = getBarWidth(entry.points, maxPoints);

                  return (
                    <button
                      key={`${animKey}-${entry.user_id}`}
                      onClick={() => router.push(`/profile/${entry.username}`)}
                      className="rank-row row-enter w-full flex items-center gap-4 rounded-xl px-4 py-3 border text-left relative overflow-hidden"
                      style={{
                        animationDelay: `${i * 35}ms`,
                        borderColor: isMe
                          ? `rgb(var(--theme-glow) / 0.25)`
                          : `rgb(var(--theme-glow) / 0.1)`,
                        backgroundColor: isMe
                          ? `rgb(var(--theme-glow) / 0.05)`
                          : "transparent",
                      }}
                    >
                      {/* Background bar (data viz) */}
                      <div
                        className="absolute inset-y-0 left-0 pointer-events-none bar-grow"
                        style={{
                          "--bar-w": `${barW}%`,
                          backgroundColor: rankColor
                            ? `${rankColor}08`
                            : `rgb(var(--theme-glow) / 0.03)`,
                        } as React.CSSProperties}
                      />

                      {/* Rank */}
                      <span
                        className="font-mono text-xs w-7 text-center shrink-0 font-bold relative z-10"
                        style={{ color: rankColor ?? `rgb(var(--theme-glow) / 0.4)` }}
                      >
                        {String(rank).padStart(2, "0")}
                      </span>

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border relative z-10"
                        style={{
                          borderColor: rankColor ? `${rankColor}50` : `rgb(var(--theme-glow) / 0.2)`,
                          backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                        }}
                      >
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black"
                            style={{ color: rankColor ?? "var(--theme-primary)" }}>
                            {entry.username[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Username */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <p className="font-medium text-sm truncate">
                          {isMe
                            ? <span style={{ color: "var(--theme-primary)" }}>you</span>
                            : entry.username}
                          {isMe && (
                            <span className="font-mono text-[10px] ml-2"
                              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                              ({entry.username})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Inline bar (activity visual) */}
                      <div className="w-32 hidden sm:flex items-center gap-2 relative z-10">
                        <div className="flex-1 h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: `rgb(var(--theme-glow) / 0.08)` }}>
                          <div
                            className="h-full rounded-full bar-grow"
                            style={{
                              "--bar-w": `${barW}%`,
                              backgroundColor: rankColor ?? "var(--theme-primary)",
                              opacity: rankColor ? 0.8 : 0.6,
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0 relative z-10">
                        <p className="font-mono text-sm font-black"
                          style={{ color: rankColor ?? "var(--theme-badge-text)" }}>
                          {formatPoints(entry.points)}
                        </p>
                      </div>
                    </button>
                  );
                })}
          </div>

          {/* ── Empty state ─────────────────────────────── */}
          {!loading && entries.length === 0 && (
            <div className="text-center py-12 font-mono">
              <p className="text-xs mb-2" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                <span style={{ color: "var(--theme-primary)" }}>$</span> ls -la
              </p>
              <p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                // no entries found
              </p>
              <p className="text-xs mt-1" style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>
                {tab === "weekly"
                  ? "be the first to study this week"
                  : "start studying to claim your spot"}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default LeaderboardPage;