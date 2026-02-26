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
  source_public_deck_id: string | null;
  source_creator_username: string | null;
  source_creator_avatar: string | null;
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

export interface PublicDeck {
  id: string;
  user_id: string;
  deck_id: string;
  title: string;
  description: string;
  add_count: number;
  created_at: string;
  star_count: number;
  is_starred: boolean;
  username: string | null;
  avatar_url: string | null;
  card_count: number;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  attached_file_name?: string | null;
  created_at: string;
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
  cards: Omit<DBCard, "id" | "deck_id">[],
  sourcePublicDeckId?: string,
  sourceCreatorUsername?: string | null,
  sourceCreatorAvatar?: string | null,
): Promise<DBDeck | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({
      title,
      user_id: user.id,
      ...(sourcePublicDeckId ? { source_public_deck_id: sourcePublicDeckId } : {}),
      ...(sourceCreatorUsername ? { source_creator_username: sourceCreatorUsername } : {}),
      ...(sourceCreatorAvatar ? { source_creator_avatar: sourceCreatorAvatar } : {}),
    })
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

// ── Public Decks ───────────────────────────────────────────────

export const getPublicDecks = async (
  search = "",
  sortBy = "stars",
  sortDir = "desc",
  page = 1,
  limit = 8
): Promise<PublicDeck[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_decks", {
    search_query: search || null,
    sort_by: sortBy,
    sort_dir: sortDir,
    page_limit: limit,
    page_offset: (page - 1) * limit,
  });
  if (error) return [];
  return data;
};

export const getPublicDecksCount = async (search = ""): Promise<number> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_decks_count", {
    search_query: search || null,
  });
  if (error) return 0;
  return data;
};

export const getMyPublishedDecks = async (): Promise<PublicDeck[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_public_decks", {
    search_query: null,
    sort_by: "newest",
    sort_dir: "desc",
    page_limit: 100,
    page_offset: 0,
  });

  if (error) return [];
  return (data as PublicDeck[]).filter((d) => d.user_id === user.id);
};

export const publishDeck = async (
  deckId: string,
  title: string,
  description: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("public_decks")
    .select("id")
    .eq("deck_id", deckId)
    .maybeSingle();

  if (existing) return { error: "Already published" };

  const { error } = await supabase
    .from("public_decks")
    .insert({ deck_id: deckId, user_id: user.id, title, description });

  if (error) return { error: error.message };
  return { error: null };
};

export const unpublishDeck = async (publicDeckId: string): Promise<void> => {
  const supabase = createClient();
  await supabase.from("public_decks").delete().eq("id", publicDeckId);
};

export const toggleStar = async (
  publicDeckId: string,
  isCurrentlyStarred: boolean
): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return isCurrentlyStarred;

  if (isCurrentlyStarred) {
    const { error } = await supabase
      .from("stars")
      .delete()
      .eq("public_deck_id", publicDeckId)
      .eq("user_id", user.id);
    if (error) return true;
    return false;
  } else {
    const { error } = await supabase
      .from("stars")
      .insert({ public_deck_id: publicDeckId, user_id: user.id });
    if (error) return false;
    return true;
  }
};

export const addPublicDeckToMyDecks = async (
  publicDeckId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: publicDeck, error: pdError } = await supabase
    .from("public_decks")
    .select("title, deck_id, user_id")
    .eq("id", publicDeckId)
    .single();

  if (pdError || !publicDeck) return { error: "Deck not found" };

  const { data: creatorProfile } = await supabase
    .from("user_profiles")
    .select("username, avatar_url")
    .eq("id", publicDeck.user_id)
    .maybeSingle();

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("keyword, hint, explanation")
    .eq("deck_id", publicDeck.deck_id);

  if (cardsError || !cards) return { error: "Failed to fetch cards" };

  const saved = await saveDeck(
    publicDeck.title,
    cards,
    publicDeckId,
    creatorProfile?.username ?? null,
    creatorProfile?.avatar_url ?? null,
  );

  if (!saved) return { error: "Failed to save deck" };

  await supabase.rpc("increment_add_count", { p_deck_id: publicDeckId });

  return { error: null };
};

export const getStarredDeckIds = async (): Promise<string[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("stars")
    .select("public_deck_id")
    .eq("user_id", user.id);

  if (error) return [];
  return data.map((s) => s.public_deck_id);
};

// ── Chat Sessions ──────────────────────────────────────────────

export async function getChatSessions(): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function createChatSession(title: string): Promise<ChatSession | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ title: title.trim(), user_id: user.id })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return false;
  return true;
}

export async function renameChatSession(sessionId: string, title: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title: title.trim() })
    .eq("id", sessionId);

  if (error) return false;
  return true;
}

// ── Chat Messages ──────────────────────────────────────────────

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  attachedFileName?: string | null,
): Promise<ChatMessage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      attached_file_name: attachedFileName ?? null,
    })
    .select()
    .single();

  if (error) return null;
  return data;
}