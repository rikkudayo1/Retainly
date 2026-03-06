"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMyFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  removeFriend,
  FriendProfile,
} from "@/lib/db";
import {
  Terminal, UserCheck, UserX, Users, Flame, Loader2, Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

const Avatar = ({ user }: { user: FriendProfile }) => (
  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
    style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }}>
    {user.avatar_url ? (
      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center font-black text-sm"
        style={{ color: "var(--theme-primary)" }}>
        {user.username?.[0]?.toUpperCase() ?? "?"}
      </div>
    )}
  </div>
);

const FriendsPage = () => {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null); // friendship_id being acted on

  useEffect(() => {
    const load = async () => {
      const [f, p] = await Promise.all([getMyFriends(), getPendingFriendRequests()]);
      setFriends(f);
      setPending(p);
      setLoading(false);
    };
    load();
  }, []);

  const handleAccept = async (fp: FriendProfile) => {
    setActing(fp.friendship_id);
    await acceptFriendRequest(fp.friendship_id);
    setPending((prev) => prev.filter((p) => p.friendship_id !== fp.friendship_id));
    setFriends((prev) => [...prev, { ...fp }]);
    setActing(null);
  };

  const handleDecline = async (friendshipId: string) => {
    setActing(friendshipId);
    await removeFriend(friendshipId);
    setPending((prev) => prev.filter((p) => p.friendship_id !== friendshipId));
    setActing(null);
  };

  const handleRemove = async (friendshipId: string) => {
    setActing(friendshipId);
    await removeFriend(friendshipId);
    setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId));
    setActing(null);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .page-enter { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .stagger-1 { animation-delay: 60ms; }
        .stagger-2 { animation-delay: 120ms; }
      `}</style>

      <div className="min-h-screen bg-background text-foreground pb-24">
        <div className="max-w-2xl mx-auto px-5 pt-14 space-y-10">

          {/* Header */}
          <div className="page-enter space-y-3">
            <div className="flex items-center gap-2 font-mono text-[11px]"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Terminal className="w-3 h-3" style={{ color: "var(--theme-primary)" }} />
              <span>~/retainly/friends</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">Friends</h1>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Study together, compete, and challenge each other.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 font-mono text-xs py-8"
              style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--theme-primary)" }} />
              loading...
            </div>
          ) : (
            <>
              {/* ── Pending requests ── */}
              {pending.length > 0 && (
                <div className="page-enter stagger-1">
                  <SectionRule label="// PENDING_REQUESTS" count={pending.length} />
                  <div className="space-y-2.5">
                    {pending.map((req) => (
                      <div key={req.friendship_id}
                        className="flex items-center gap-3 rounded-2xl border p-3.5"
                        style={{ borderColor: `rgb(var(--theme-glow) / 0.15)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                        <Link href={`/profile/${req.username}`}>
                          <Avatar user={req} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${req.username}`}
                            className="font-bold text-sm truncate block hover:opacity-70 transition-opacity">
                            {req.username}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px]"
                            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                            <span className="flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" style={{ color: "#f97316" }} />
                              {req.streak}
                            </span>
                            <span style={{ color: `rgb(var(--theme-glow) / 0.2)` }}>·</span>
                            <span>wants to be friends</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAccept(req)}
                            disabled={acting === req.friendship_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs transition-all"
                            style={{ background: "var(--theme-primary)", color: "#fff" }}
                          >
                            {acting === req.friendship_id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <><UserCheck className="w-3 h-3" /> accept</>}
                          </button>
                          <button
                            onClick={() => handleDecline(req.friendship_id)}
                            disabled={acting === req.friendship_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs border transition-all"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.5)` }}
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Friends list ── */}
              <div className="page-enter stagger-2">
                <SectionRule label={`// FRIENDS`} count={friends.length} />

                {friends.length === 0 ? (
                  <div className="text-center py-12 font-mono">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                      // no friends yet
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Visit someone's profile to send a friend request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {friends.map((friend) => (
                      <div key={friend.friendship_id}
                        className="flex items-center gap-3 rounded-2xl border p-3.5 transition-all"
                        style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, backgroundColor: `rgb(var(--theme-glow) / 0.02)` }}>
                        <Link href={`/profile/${friend.username}`}>
                          <Avatar user={friend} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${friend.username}`}
                            className="font-bold text-sm truncate block hover:opacity-70 transition-opacity">
                            {friend.username}
                          </Link>
                          <div className="flex items-center gap-3 mt-0.5 font-mono text-[10px]"
                            style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                            <span className="flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" style={{ color: "#f97316" }} />
                              {friend.streak} streak
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => router.push(`/profile/${friend.username}`)}
                            className="px-3 py-1.5 rounded-xl font-mono text-xs border transition-all"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.2)`, color: `rgb(var(--theme-glow) / 0.5)` }}
                            onMouseEnter={(e) => {
                              (e.currentTarget).style.borderColor = "var(--theme-primary)";
                              (e.currentTarget).style.color = "var(--theme-primary)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget).style.borderColor = `rgb(var(--theme-glow) / 0.2)`;
                              (e.currentTarget).style.color = `rgb(var(--theme-glow) / 0.5)`;
                            }}
                          >
                            profile
                          </button>
                          <button
                            onClick={() => handleRemove(friend.friendship_id)}
                            disabled={acting === friend.friendship_id}
                            title="Remove friend"
                            className="p-1.5 rounded-xl font-mono text-xs border transition-all"
                            style={{ borderColor: `rgb(var(--theme-glow) / 0.12)`, color: `rgb(var(--theme-glow) / 0.3)` }}
                            onMouseEnter={(e) => {
                              (e.currentTarget).style.borderColor = "rgb(239 68 68 / 0.4)";
                              (e.currentTarget).style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget).style.borderColor = `rgb(var(--theme-glow) / 0.12)`;
                              (e.currentTarget).style.color = `rgb(var(--theme-glow) / 0.3)`;
                            }}
                          >
                            {acting === friend.friendship_id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <UserX className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FriendsPage;