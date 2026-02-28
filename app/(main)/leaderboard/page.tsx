"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, LeaderboardEntry } from "@/lib/db";
import { getBanner } from "@/lib/banners";
import { createClient } from "@/lib/supabase";

type Tab = "weekly" | "alltime";

const MEDALS = ["🥇", "🥈", "🥉"];

const getRankStyle = (rank: number) => {
  if (rank === 1)
    return {
      glow: "0 0 20px var(--theme-primary)",
      border: "var(--theme-primary)",
      labelColor: "var(--theme-primary)",
    };
  if (rank === 2)
    return {
      glow: "0 0 12px rgb(var(--theme-glow) / 0.4)",
      border: `rgb(var(--theme-glow) / 0.5)`,
      labelColor: `rgb(var(--theme-glow) / 0.8)`,
    };
  if (rank === 3)
    return {
      glow: "0 0 8px rgb(var(--theme-glow) / 0.25)",
      border: `rgb(var(--theme-glow) / 0.35)`,
      labelColor: `rgb(var(--theme-glow) / 0.6)`,
    };
  return {
    glow: "none",
    border: `rgb(var(--theme-glow) / 0.12)`,
    labelColor: "var(--muted-foreground)",
  };
};

function formatPoints(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

const LeaderboardPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  // Get current user for highlighting
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24">

        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-3xl mb-1">🏆</p>
          <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Points are earned from every study session · 1 activity = 100 pts
          </p>
        </div>

        {/* My rank pill — only shown when logged in and on list */}
        {myRank && myRank > 0 && (
          <div
            className="flex items-center justify-center mb-6"
          >
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.3)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.08)`,
                color: "var(--theme-badge-text)",
              }}
            >
              Your rank this {tab === "weekly" ? "week" : "time"}:
              <span style={{ color: "var(--theme-primary)" }}>#{myRank}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex rounded-xl p-1 mb-6 border"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.15)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.04)`,
          }}
        >
          {(["weekly", "alltime"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
              style={
                tab === t
                  ? {
                      backgroundColor: "var(--theme-primary)",
                      color: "#fff",
                      boxShadow: `0 2px 12px rgb(var(--theme-glow) / 0.4)`,
                    }
                  : {
                      color: "var(--muted-foreground)",
                    }
              }
            >
              {t === "weekly" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>

        {/* Top 3 podium — bar chart style */}
        {!loading && entries.length >= 1 && (() => {
          const podiumOrder = [
            { entry: entries[1] ?? null, rank: 2, barHeight: 80,  color: "#94a3b8", shadow: "none" },
            { entry: entries[0] ?? null, rank: 1, barHeight: 112, color: "#f59e0b", shadow: "none" },
            { entry: entries[2] ?? null, rank: 3, barHeight: 60,  color: "#b45309", shadow: "none" },
          ];

          return (
            <div className="flex items-end justify-center gap-3 mb-8">
              {podiumOrder.map(({ entry, rank, barHeight, color, shadow }, podiumIdx) => {
                const isMe = entry?.user_id === currentUserId;
                const avatarSize = rank === 1 ? "w-14 h-14" : "w-11 h-11";

                return (
                  <div key={podiumIdx} className="flex flex-col items-center gap-2" style={{ width: "30%" }}>

                    {/* Avatar + username — above the bar */}
                    {entry ? (
                      <button
                        onClick={() => router.push(`/profile/${entry.username}`)}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div
                          className={`${avatarSize} rounded-full overflow-hidden border-2 transition-transform group-hover:scale-110 group-hover:cursor-pointer`}
                          style={{ borderColor: color, boxShadow: shadow }}
                        >
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-black"
                              style={{ backgroundColor: `${color}22`, color }}
                            >
                              {entry.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-center truncate w-full px-1" style={{ color: isMe ? color : undefined }}>
                          {isMe ? "You" : entry.username}
                        </p>
                        <p className="text-[10px] font-black" style={{ color }}>
                          {formatPoints(entry.points)} pts
                        </p>
                      </button>
                    ) : (
                      <div className={`${avatarSize} rounded-full`} style={{ backgroundColor: `rgb(var(--theme-glow) / 0.05)` }} />
                    )}

                    {/* The bar */}
                    <div
                      className="w-full flex items-center justify-center"
                      style={{
                        height: barHeight,
                        backgroundColor: entry ? `${color}22` : `rgb(var(--theme-glow) / 0.04)`,
                        borderTop: `3px solid ${entry ? color : "transparent"}`,
                        borderLeft: `1px solid ${entry ? color + "44" : "transparent"}`,
                        borderRight: `1px solid ${entry ? color + "44" : "transparent"}`,
                        boxShadow: entry ? shadow : "none",
                      }}
                    >
                      <span className="text-xl">{entry ? MEDALS[rank - 1] : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Rank list — all entries */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border h-16 animate-pulse"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.1)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  }}
                />
              ))
            : entries.map((entry, i) => {
                const rank = i + 1;
                const isMe = entry.user_id === currentUserId;

                return (
                  <button
                    key={`${animKey}-${entry.user_id}`}
                    onClick={() => router.push(`/profile/${entry.username}`)}
                    className="w-full flex items-center gap-4 rounded-md px-4 py-3 transition-all hover:scale-[1.01] hover:cursor-pointer hover:border-opacity-50 text-left"
                    style={{
                      backgroundColor: isMe
                        ? `rgb(var(--theme-glow) / 0.1)`
                        : "transparent",
                      animationDelay: `${i * 30}ms`,
                    }}
                  >
                    {/* Rank number */}
                    <span
                      className="text-sm font-black w-7 text-center shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {rank}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden shrink-0 border"
                      style={{
                        borderColor: `rgb(var(--theme-glow) / 0.2)`,
                        backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                      }}
                    >
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-black"
                          style={{ color: "var(--theme-primary)" }}
                        >
                          {entry.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {isMe ? (
                          <span>
                            {entry.username}{" "}
                            <span
                              className="text-xs font-bold ml-1"
                              style={{ color: "var(--theme-primary)" }}
                            >
                              (you)
                            </span>
                          </span>
                        ) : (
                          entry.username
                        )}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-black"
                        style={{ color: "var(--theme-badge-text)" }}
                      >
                        {formatPoints(entry.points)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </button>
                );
              })}
        </div>

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{
              borderColor: `rgb(var(--theme-glow) / 0.1)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            <p className="text-3xl mb-3">📭</p>
            <p className="font-bold">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "weekly"
                ? "Be the first to study this week!"
                : "Start studying to claim your spot."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;