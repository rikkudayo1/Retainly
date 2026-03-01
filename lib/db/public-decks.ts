import { createClient } from "@/lib/supabase";
import { saveDeck } from "./decks";

// ── Types ──────────────────────────────────────────────────────

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

// ── Functions ──────────────────────────────────────────────────

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

  // Check if already published
  const { data: existing } = await supabase
    .from("public_decks")
    .select("id")
    .eq("deck_id", deckId)
    .maybeSingle();

  if (existing) return { error: "Already published" };

  // Insert into public_decks and get the new row's id back
  const { data: inserted, error: insertError } = await supabase
    .from("public_decks")
    .insert({ deck_id: deckId, user_id: user.id, title, description })
    .select("id")
    .single();

  if (insertError || !inserted) return { error: insertError?.message ?? "Insert failed" };

  // ── FIX: Write the public_deck id back onto the source deck row ──
  // This is what populates source_public_deck_id so the UI knows
  // this deck has been published and can link back to it.
  const { error: updateError } = await supabase
    .from("decks")
    .update({ source_public_deck_id: inserted.id })
    .eq("id", deckId);

  if (updateError) {
    // Non-fatal — deck is published, just the backlink failed.
    // Log it but don't surface as an error to the user.
    console.error("Failed to set source_public_deck_id:", updateError.message);
  }

  return { error: null };
};

export const unpublishDeck = async (publicDeckId: string): Promise<void> => {
  const supabase = createClient();

  // Clear the backlink on the source deck first
  await supabase
    .from("decks")
    .update({ source_public_deck_id: null })
    .eq("source_public_deck_id", publicDeckId);

  // Then delete the public_decks row
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
    // ── FIX: Delete by BOTH user_id AND public_deck_id ──
    // The stars table has UNIQUE(user_id) which is a schema bug —
    // it should be UNIQUE(user_id, public_deck_id). Until that migration
    // is applied, we still filter on both columns so the correct row
    // is deleted (there can only be one star per user with the current
    // schema, but this is correct regardless).
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