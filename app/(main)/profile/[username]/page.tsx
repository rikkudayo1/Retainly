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
import BannerPicker from "@/components/BannerPicker";
import { createClient } from "@/lib/supabase";
import PublicDeckCard from "@/components/PublicDeckCard";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { useLanguage } from "@/context/LanguageContext";

interface ProfileData {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_id: string;
  streak: number;
  gems: number;
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
    } catch {
      return [];
    }
  });
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadingDecks(true);

        const supabase = createClient();

        const [
          profileData,
          {
            data: { user: currentUser },
          },
        ] = await Promise.all([
          getProfileByUsername(username),
          supabase.auth.getUser(),
        ]);

        if (!profileData) {
          if (!isMounted) return;
          setNotFound(true);
          return;
        }

        if (!isMounted) return;

        setProfile(profileData as any);
        setBannerId(profileData.banner_id ?? "aurora");
        setIsOwn(currentUser?.id === profileData.id);

        const [deckCount, decks, starredIds, heatmap] = await Promise.all([
          getPublishedDeckCountByUserId(profileData.id),
          getPublicDecks("", "newest", "desc", 1, 100),
          getStarredDeckIds(),
          getActivityHeatmap(profileData.id),
        ]);

        if (!isMounted) return;

        setDeckCount(deckCount);
        setActivityData(heatmap);

        const userDecks = decks
          .filter((d) => d.user_id === profileData.id)
          .map((d) => ({
            ...d,
            is_starred: starredIds.includes(d.id),
          }));

        setPublishedDecks(userDecks);

        if (currentUser) {
          const { data: ownDecks } = await supabase
            .from("decks")
            .select("title")
            .eq("user_id", currentUser.id);

          const ownedTitles = new Set(
            (ownDecks ?? []).map((d: any) => d.title),
          );

          const alreadyAddedIds = userDecks
            .filter(
              (d) => ownedTitles.has(d.title) && d.user_id !== currentUser.id,
            )
            .map((d) => d.id);

          setAddedIds((prev) => {
            const merged = [...new Set([...prev, ...alreadyAddedIds])];
            sessionStorage.setItem(
              "retainly_added_decks",
              JSON.stringify(merged),
            );
            return merged;
          });
        }
      } catch (error) {
        console.error("Profile load failed:", error);
        setNotFound(true);
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingDecks(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--theme-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );

  if (notFound)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
        <p className="text-4xl">👤</p>
        <p className="font-bold text-lg">{t("profile.not_found")}</p>
        <p className="text-sm text-muted-foreground">
          @{username} {t("profile.not_found_sub")}
        </p>
      </div>
    );

  const banner = getBanner(bannerId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Banner */}
      <div
        className="relative w-full h-48 sm:h-56 banner-bg"
        style={{ background: banner.gradient }}
      >
        {isOwn && (
          <div className="absolute top-4 right-4">
            <BannerPicker
              currentBannerId={bannerId}
              onChanged={(id) => setBannerId(id)}
            />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-4 shrink-0"
            style={{
              borderColor: "var(--background)",
              backgroundColor: `rgb(var(--theme-glow) / 0.1)`,
              boxShadow: `0 0 0 2px var(--theme-primary)`,
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-black"
                style={{ color: "var(--theme-primary)" }}
              >
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>

        {/* Username + bio */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-black">{profile?.username}</h1>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 gap-3 rounded-2xl border p-4 mb-8"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.15)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
          }}
        >
          <div className="text-center space-y-1">
            <p className="text-2xl font-black">🔥 {profile?.streak ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("profile.streak")}</p>
          </div>
          <div
            className="text-center space-y-1 border-x"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)` }}
          >
            <p className="text-2xl font-black">💎 {profile?.gems ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("profile.gems")}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-black">📚 {deckCount}</p>
            <p className="text-xs text-muted-foreground">{t("profile.published")}</p>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <ActivityHeatmap data={activityData} />
        </div>

        {/* Published decks */}
        <div className="space-y-4 pb-12">
          <h2
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--theme-badge-text)" }}
          >
            {t("profile.decks")}
          </h2>

          {loadingDecks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5 animate-pulse h-32"
                  style={{
                    borderColor: `rgb(var(--theme-glow) / 0.1)`,
                    backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
                  }}
                />
              ))}
            </div>
          ) : publishedDecks.length === 0 ? (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{
                borderColor: `rgb(var(--theme-glow) / 0.1)`,
                backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
              }}
            >
              <p className="text-sm text-muted-foreground/40">
                {t("profile.no_decks")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publishedDecks.map((deck) => (
                <PublicDeckCard
                  key={deck.id}
                  deck={deck}
                  isOwn={isOwn}
                  added={addedIds.includes(deck.id)}
                  onAdded={(id) => {
                    setAddedIds((prev) => {
                      const next = [...new Set([...prev, id])];
                      sessionStorage.setItem(
                        "retainly_added_decks",
                        JSON.stringify(next),
                      );
                      return next;
                    });
                  }}
                  onUnpublish={
                    isOwn
                      ? async (id) => {
                          await unpublishDeck(id);
                          setPublishedDecks((prev) =>
                            prev.filter((d) => d.id !== id),
                          );
                          setDeckCount((p) => p - 1);
                        }
                      : undefined
                  }
                  onDelete={
                    isOwn
                      ? async (id) => {
                          const pub = publishedDecks.find((d) => d.id === id);
                          if (!pub) return;
                          await unpublishDeck(id);
                          await deleteDeck(pub.deck_id);
                          setPublishedDecks((prev) =>
                            prev.filter((d) => d.id !== id),
                          );
                          setDeckCount((p) => p - 1);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;