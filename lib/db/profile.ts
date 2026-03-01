import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface DBProfileFull {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_id: string;
  gems: number;
  streak: number;
  streak_day: number;
  unlocked_themes: string[];
  color_theme: string;
  mode: string;
  lang: string;
  last_seen: string | null;
  last_reward: string | null;
  created_at: string | null;
  style_mode: "default" | "pixel" | null;
}

// ── Functions ──────────────────────────────────────────────────

export const getProfile = async (): Promise<DBProfileFull | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data;
};

export const updateProfile = async (updates: Partial<Omit<DBProfileFull, "id">>) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);
};

export const getProfileByUsername = async (
  username: string
): Promise<DBProfileFull | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (error) return null;
  return data;
};

export const updateProfileSettings = async (updates: {
  username?: string;
  bio?: string;
  banner_id?: string;
  avatar_url?: string;
}): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (updates.username) {
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", updates.username)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) return { error: "Username already taken" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { error: null };
};

export const uploadAvatar = async (file: File): Promise<string | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  await supabase
    .from("user_profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  return publicUrl;
};

export const getDeckCount = async (): Promise<number> => {
  const supabase = createClient();
  const { count } = await supabase
    .from("decks")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
};

export const getDeckCountByUserId = async (userId: string): Promise<number> => {
  const supabase = createClient();
  const { count } = await supabase
    .from("decks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
};

export const getPublishedDeckCountByUserId = async (userId: string): Promise<number> => {
  const supabase = createClient();
  const { count } = await supabase
    .from("public_decks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
};