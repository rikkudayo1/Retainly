"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProfileByUsername, getDeckCountByUserId } from "@/lib/db";
import { getBanner } from "@/lib/banners";
import BannerPicker from "@/components/BannerPicker";
import { createClient } from "@/lib/supabase";

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

  useEffect(() => {
    const load = async () => {
      const [data, { data: { user } }] = await Promise.all([
        getProfileByUsername(username),
        createClient().auth.getUser(),
      ]);

      if (!data) { setNotFound(true); setLoading(false); return; }

      setProfile(data as any);
      setBannerId((data as any).banner_id ?? "aurora");
      setIsOwn(user?.id === data.id);

      const count = await getDeckCountByUserId(data.id);
      setDeckCount(count);
      setLoading(false);
    };

    load();
  }, [username]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
      <p className="text-4xl">👤</p>
      <p className="font-bold text-lg">User not found</p>
      <p className="text-sm text-muted-foreground">@{username} doesn't exist.</p>
    </div>
  );

  const banner = getBanner(bannerId);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Banner */}
      <div className="relative w-full h-48 sm:h-56"
        style={{ background: banner.gradient }}>
        {isOwn && (
          <div className="absolute top-4 right-4">
            <BannerPicker
              currentBannerId={bannerId}
              onChanged={(id) => setBannerId(id)}
            />
          </div>
        )}
      </div>

      {/* Profile content */}
      <div className="max-w-2xl mx-auto px-6">

        {/* Avatar — overlaps banner */}
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
              <div className="w-full h-full flex items-center justify-center text-3xl font-black"
                style={{ color: "var(--theme-primary)" }}>
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>

        {/* Username + bio */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-black">{profile?.username}</h1>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
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
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center space-y-1 border-x"
            style={{ borderColor: `rgb(var(--theme-glow) / 0.1)` }}>
            <p className="text-2xl font-black">💎 {profile?.gems ?? 0}</p>
            <p className="text-xs text-muted-foreground">Gems</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-black">📚 {deckCount}</p>
            <p className="text-xs text-muted-foreground">Decks</p>
          </div>
        </div>

        {/* Future: public decks */}
        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            borderColor: `rgb(var(--theme-glow) / 0.1)`,
            backgroundColor: `rgb(var(--theme-glow) / 0.02)`,
          }}
        >
          <p className="text-sm text-muted-foreground/40">Public decks coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;