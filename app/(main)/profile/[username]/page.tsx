"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getProfileByUsername,
  getPublishedDeckCountByUserId,
  getPublicDecks,
  getStarredDeckIds,
  unpublishDeck,
  deleteDeck,
  getActivityHeatmap,
  PublicDeck,
} from "@/lib/db";
import { getBanner } from "@/lib/banners";
import BannerPicker, { bannerStyle } from "@/components/BannerPicker";
import { createClient } from "@/lib/supabase";
import PublicDeckCard from "@/components/PublicDeckCard";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { useLanguage } from "@/context/LanguageContext";
import { Terminal, Flame, Gem, BookOpen } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";

interface ProfileData {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_id: string;
  streak: number;
  gems: number;
}

function formatStat(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [deckCount, setDeckCount] = useState(0);
  const [isOwn, setIsOwn] = useState(false);
  const [bannerId, setBannerId] = useState("aurora");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [publishedDecks, setPublishedDecks] = useState<PublicDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("retainly_added_decks");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setLoadingDecks(true);
        const supabase = createClient();
        const [profileData, { data: { user: currentUser } }] = await Promise.all([
          getProfileByUsername(username),
          supabase.auth.getUser(),
        ]);

        if (!profileData) { if (!isMounted) return; setNotFound(true); return; }
        if (!isMounted) return;

        setProfile(profileData as any);
        setBannerId(profileData.banner_id ?? "aurora");
        setIsOwn(currentUser?.id === profileData.id);

        const [count, decks, starredIds, heatmap] = await Promise.all([
          getPublishedDeckCountByUserId(profileData.id),
          getPublicDecks("", "newest", "desc", 1, 100),
          getStarredDeckIds(),
          getActivityHeatmap(profileData.id),
        ]);

        if (!isMounted) return;

        setDeckCount(count);
        setActivityData(heatmap);

        const userDecks = decks
          .filter((d) => d.user_id === profileData.id)
          .map((d) => ({ ...d, is_starred: starredIds.includes(d.id) }));

        setPublishedDecks(userDecks);

        if (currentUser) {
          const { data: ownDecks } = await supabase
            .from("decks").select("title").eq("user_id", currentUser.id);
          const ownedTitles = new Set((ownDecks ?? []).map((d: any) => d.title));
          const alreadyAddedIds = userDecks
            .filter((d) => ownedTitles.has(d.title) && d.user_id !== currentUser.id)
            .map((d) => d.id);
          setAddedIds((prev) => {
            const merged = [...new Set([...prev, ...alreadyAddedIds])];
            sessionStorage.setItem("retainly_added_decks", JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.error("Profile load failed:", err);
        setNotFound(true);
      } finally {
        if (isMounted) { setLoading(false); setLoadingDecks(false); }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [username]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
      </div>
    );

  if (notFound)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-4">
        <div className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
          <span style={{ color: "var(--theme-primary)" }}>$</span> whoami @{username}
        </div>
        <p className="font-mono text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
          // user not found
        </p>
      </div>
    );

  const banner = getBanner(bannerId);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .section-enter { opacity: 0; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .skeleton {
          background: linear-gradient(90deg, rgb(var(--theme-glow)/0.06) 0%, rgb(var(--theme-glow)/0.1) 50%, rgb(var(--theme-glow)/0.06) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">

        {/* ── Banner ──────────────────────────────────── */}
        <div
          className="relative w-full h-44 sm:h-52 overflow-hidden"
          style={{
            ...bannerStyle(banner),
          }}
        >
          {/* Scanline overlay for terminal feel */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
            }}
          />
          {isOwn && (
            <div className="absolute top-4 right-4 z-10">
              <BannerPicker currentBannerId={bannerId} onChanged={(id) => setBannerId(id)} />
            </div>
          )}
          {/* Terminal path watermark */}
          <div
            className="absolute bottom-3 left-4 font-mono text-[10px] tracking-widest select-none pointer-events-none"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ~/retainly/profile/{username}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5">

          {/* ── Avatar + identity ───────────────────────── */}
          <div className="section-enter -mt-10 mb-6">

            {/* Row: avatar + name stack */}
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden shrink-0"
                style={{
                  border: "3px solid var(--background)",
                  backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
                  boxShadow: `0 0 0 1px rgb(var(--theme-glow) / 0.2), 0 0 24px rgb(var(--theme-glow) / 0.12)`,
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                    style={{ color: "var(--theme-primary)" }}>
                    {profile?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>

              {/* Username + handle — vertically centered with avatar bottom */}
              <div className="pb-1 space-y-0.5 min-w-0">
                <h1 className="text-xl font-black leading-none tracking-tight truncate">
                  {profile?.username}
                </h1>
                <p
                  className="font-mono text-[11px]"
                  style={{ color: `rgb(var(--theme-glow) / 0.4)` }}
                >
                  @{profile?.username}
                </p>
              </div>
            </div>

            {/* Bio — below the avatar row, full width, markdown rendered */}
            {profile?.bio ? (
              <div className="mt-7 break-words" style={{ maxWidth: "60ch" }}>
                <MarkdownContent content={profile.bio} />
              </div>
            ) : isOwn ? (
              <p
                className="mt-3 font-mono text-[11px]"
                style={{ color: `rgb(var(--theme-glow) / 0.3)` }}
              >
                // no bio yet — add one in settings
              </p>
            ) : null}
          </div>

          {/* ── Stats strip ─────────────────────────────── */}
          <div
            className="section-enter flex items-center rounded-xl border overflow-hidden mb-8"
            style={{
              animationDelay: "60ms",
              borderColor: `rgb(var(--theme-glow) / 0.12)`,
              backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
            }}
          >
            {[
              { icon: <Flame className="w-3.5 h-3.5" />, color: "#f97316", value: formatStat(profile?.streak ?? 0), label: t("profile.streak") },
              { icon: <Gem className="w-3.5 h-3.5" />, color: "var(--theme-primary)", value: formatStat(profile?.gems ?? 0), label: t("profile.gems") },
              { icon: <BookOpen className="w-3.5 h-3.5" />, color: "var(--theme-badge-text)", value: formatStat(deckCount), label: t("profile.published") },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 py-4"
                style={{
                  borderRight: i < 2 ? `1px solid rgb(var(--theme-glow) / 0.1)` : "none",
                }}
              >
                <div className="flex items-center gap-1.5" style={{ color: stat.color }}>
                  {stat.icon}
                  <span className="font-black text-xl leading-none">{stat.value}</span>
                </div>
                <span className="font-mono text-[10px]" style={{ color: `rgb(var(--theme-glow) / 0.4)` }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Activity heatmap ────────────────────────── */}
          <div
            className="section-enter mb-8"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-[10px] tracking-[0.2em] shrink-0"
                style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                // ACTIVITY
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
            </div>
            <ActivityHeatmap data={activityData} />
          </div>

          {/* ── Published decks ─────────────────────────── */}
          <div
            className="section-enter pb-16"
            style={{ animationDelay: "140ms" }}
          >
            <div className="flex items-center gap-4 mb-5">
              <span className="font-mono text-[10px] tracking-[0.2em] shrink-0"
                style={{ color: `rgb(var(--theme-glow) / 0.45)` }}>
                // DECKS
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `rgb(var(--theme-glow) / 0.1)` }} />
              {!loadingDecks && publishedDecks.length > 0 && (
                <span className="font-mono text-[10px] shrink-0"
                  style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  {publishedDecks.length} published
                </span>
              )}
            </div>

            {loadingDecks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-xl skeleton" />
                ))}
              </div>
            ) : publishedDecks.length === 0 ? (
              <div className="text-center py-8 font-mono">
                <p className="text-xs" style={{ color: `rgb(var(--theme-glow) / 0.3)` }}>
                  <span style={{ color: "var(--theme-primary)" }}>$</span> ls ./decks
                </p>
                <p className="text-xs mt-1" style={{ color: `rgb(var(--theme-glow) / 0.25)` }}>
                  // no published decks yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {publishedDecks.map((deck) => (
                  <PublicDeckCard
                    key={deck.id}
                    deck={deck}
                    isOwn={isOwn}
                    added={addedIds.includes(deck.id)}
                    onAdded={(id) => {
                      setAddedIds((prev) => {
                        const next = [...new Set([...prev, id])];
                        sessionStorage.setItem("retainly_added_decks", JSON.stringify(next));
                        return next;
                      });
                    }}
                    onUnpublish={isOwn ? async (id) => {
                      await unpublishDeck(id);
                      setPublishedDecks((prev) => prev.filter((d) => d.id !== id));
                      setDeckCount((p) => p - 1);
                    } : undefined}
                    onDelete={isOwn ? async (id) => {
                      const pub = publishedDecks.find((d) => d.id === id);
                      if (!pub) return;
                      await unpublishDeck(id);
                      await deleteDeck(pub.deck_id);
                      setPublishedDecks((prev) => prev.filter((d) => d.id !== id));
                      setDeckCount((p) => p - 1);
                    } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;