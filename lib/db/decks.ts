import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

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

// ── Functions ──────────────────────────────────────────────────

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

// ── Card CRUD ────────────────────────────────

export const updateCard = async (
  id: string,
  data: Partial<Pick<DBCard, "keyword" | "hint" | "explanation">>
): Promise<boolean> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .update(data)
    .eq("id", id);
  return !error;
};

export const deleteCard = async (id: string): Promise<boolean> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id);
  return !error;
};

export const createCard = async (
  deckId: string,
  data: Pick<DBCard, "keyword" | "hint" | "explanation">
): Promise<DBCard | null> => {
  const supabase = createClient();
  const { data: card, error } = await supabase
    .from("cards")
    .insert({ ...data, deck_id: deckId })
    .select()
    .single();
  if (error) return null;
  return card;
};

export const updateDeckTitle = async (
  id: string,
  title: string
): Promise<boolean> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("decks")
    .update({ title })
    .eq("id", id);
  return !error;
};