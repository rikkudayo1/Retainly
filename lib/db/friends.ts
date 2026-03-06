import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export interface FriendRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  friendship_id: string;
  id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
  gems: number;
  /** only present on incoming pending requests */
  requested_at?: string;
}

// ── Helpers ────────────────────────────────────────────────────

/** Returns the friendship row between the current user and another user, or null. */
export const getFriendship = async (
  otherUserId: string
): Promise<FriendRow | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("friends")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),` +
      `and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  return data ?? null;
};

/** Derives a FriendStatus from the friendship row. */
export const getFriendStatus = async (
  otherUserId: string
): Promise<FriendStatus> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "none";

  const row = await getFriendship(otherUserId);
  if (!row) return "none";
  if (row.status === "accepted") return "accepted";
  if (row.status === "pending") {
    return row.requester_id === user.id ? "pending_sent" : "pending_received";
  }
  return "none"; // declined — treat as none so they can re-request
};

// ── Actions ────────────────────────────────────────────────────

/** Send a friend request to another user. */
export const sendFriendRequest = async (
  addresseeId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === addresseeId) return { error: "Cannot add yourself" };

  const { error } = await supabase
    .from("friends")
    .insert({ requester_id: user.id, addressee_id: addresseeId });

  if (error) return { error: error.message };
  return { error: null };
};

/** Accept an incoming friend request. */
export const acceptFriendRequest = async (
  friendshipId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("friends")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);
  return { error: error ? error.message : null };
};

/** Decline or cancel a friend request / remove a friend. */
export const removeFriend = async (
  friendshipId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendshipId);
  return { error: error ? error.message : null };
};

// ── Queries ────────────────────────────────────────────────────

/** Returns accepted friends for the current user with their profiles. */
export const getMyFriends = async (): Promise<FriendProfile[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friends")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error || !data?.length) return [];

  const otherIds = data.map((row) =>
    row.requester_id === user.id ? row.addressee_id : row.requester_id
  );
  const friendshipIdMap = new Map(
    data.map((row) => [
      row.requester_id === user.id ? row.addressee_id : row.requester_id,
      row.id,
    ])
  );

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url, streak, gems")
    .in("id", otherIds);

  return (profiles ?? []).map((p) => ({
    friendship_id: friendshipIdMap.get(p.id)!,
    id: p.id,
    username: p.username,
    avatar_url: p.avatar_url,
    streak: p.streak,
    gems: p.gems,
  }));
};

/** Returns pending incoming friend requests for the current user. */
export const getPendingFriendRequests = async (): Promise<FriendProfile[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friends")
    .select("id, requester_id, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error || !data?.length) return [];

  const requesterIds = data.map((r) => r.requester_id);
  const metaMap = new Map(data.map((r) => [r.requester_id, { id: r.id, created_at: r.created_at }]));

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url, streak, gems")
    .in("id", requesterIds);

  return (profiles ?? []).map((p) => ({
    friendship_id: metaMap.get(p.id)!.id,
    id: p.id,
    username: p.username,
    avatar_url: p.avatar_url,
    streak: p.streak,
    gems: p.gems,
    requested_at: metaMap.get(p.id)!.created_at,
  }));
};

/** Returns the count of pending incoming requests — used for navbar badge. */
export const getPendingFriendRequestCount = async (): Promise<number> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("friends")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  return count ?? 0;
};