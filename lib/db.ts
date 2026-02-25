import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface DBFile {
  id: string;
  user_id: string;
  name: string;
  size: number;
  uploaded_at: string;
  text: string;
}

export interface DBCard {
  id: string;
  deck_id: string;
  keyword: string;
  hint: string;
  explanation: string;
}

export interface DBDeck {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  cards?: DBCard[];
}

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
}

// ── Profile ────────────────────────────────────────────────────

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
      .single();
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

// ── Files ──────────────────────────────────────────────────────

export const getFiles = async (): Promise<DBFile[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) return [];
  return data;
};

export const saveFile = async (
  file: Omit<DBFile, "id" | "user_id">
): Promise<DBFile | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("files")
    .insert({ ...file, user_id: user.id })
    .select()
    .single();

  if (error) return null;
  return data;
};

export const deleteFile = async (id: string) => {
  const supabase = createClient();
  await supabase.from("files").delete().eq("id", id);
};

// ── Decks ──────────────────────────────────────────────────────

export const getDecks = async (): Promise<DBDeck[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("*, cards(*)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
};

export const getDeck = async (id: string): Promise<DBDeck | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("*, cards(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
};

export const saveDeck = async (
  title: string,
  cards: Omit<DBCard, "id" | "deck_id">[]
): Promise<DBDeck | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({ title, user_id: user.id })
    .select()
    .single();

  if (deckError || !deck) return null;

  const { error: cardsError } = await supabase
    .from("cards")
    .insert(cards.map((c) => ({ ...c, deck_id: deck.id })));

  if (cardsError) return null;

  return {
    ...deck,
    cards: cards.map((c) => ({ ...c, id: crypto.randomUUID(), deck_id: deck.id })),
  };
};

export const deleteDeck = async (id: string) => {
  const supabase = createClient();
  await supabase.from("decks").delete().eq("id", id);
};

// ── Gems ───────────────────────────────────────────────────────

export const addGemsDB = async (amount: number) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("increment_gems", { user_id: user.id, amount });
};

export const spendGemsDB = async (amount: number): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("spend_gems", {
    user_id: user.id,
    amount,
  });

  if (error) return false;
  return data === true;
};