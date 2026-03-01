import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  banner_id: string;
  points: number;
  total_activity: number;
}

// ── Functions ──────────────────────────────────────────────────

/**
 * Log one activity hit for the current user today.
 * Call this anywhere an action happens — quiz submit, flashcard flip,
 * summary generation, etc. It's idempotent per day (just increments count).
 */
export async function logActivity(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("increment_activity", { p_user_id: user.id });
}

/**
 * Fetch a full year of activity for a given user id.
 * Returns a Record<"YYYY-MM-DD", number> ready to pass into <ActivityHeatmap />.
 */
export async function getActivityHeatmap(
  userId: string
): Promise<Record<string, number>> {
  const supabase = createClient();

  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("activity_log")
    .select("activity_date, count")
    .eq("user_id", userId)
    .gte("activity_date", sinceStr)
    .order("activity_date", { ascending: true });

  if (error || !data) return {};

  return Object.fromEntries(
    data.map((row) => [
      row.activity_date.slice(0, 10),
      Number(row.count),
    ])
  );
}

export async function getLeaderboard(
  type: "weekly" | "alltime"
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const view =
    type === "weekly" ? "leaderboard_weekly" : "leaderboard_alltime";

  const { data, error } = await supabase
    .from(view)
    .select("user_id, username, avatar_url, banner_id, points, total_activity");

  if (error || !data) return [];
  return data as LeaderboardEntry[];
}