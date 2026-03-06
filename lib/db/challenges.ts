import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  quiz_id: string;
  challenger_id: string;
  challengee_id: string;
  challenger_score: number;
  challengee_score: number | null;
  question_count: number;
  status: "pending" | "completed" | "expired";
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  // joined
  quiz_title?: string;
  challenger_username?: string;
  challenger_avatar?: string | null;
  challengee_username?: string;
  challengee_avatar?: string | null;
}

// ── Send ───────────────────────────────────────────────────────

/**
 * Send a challenge to a friend after finishing a quiz.
 * challenger_score = raw correct count (matches quiz_attempts.score)
 */
export const sendChallenge = async ({
  quizId,
  challengeeId,
  challengerScore,
  questionCount,
}: {
  quizId: string;
  challengeeId: string;
  challengerScore: number;
  questionCount: number;
}): Promise<{ data: Challenge | null; error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  if (user.id === challengeeId) return { data: null, error: "Cannot challenge yourself" };

  // One active challenge per quiz pair — upsert by challenger+challengee+quiz
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("challenger_id", user.id)
    .eq("challengee_id", challengeeId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    // Update the existing pending challenge with the new score
    const { data, error } = await supabase
      .from("challenges")
      .update({
        challenger_score: challengerScore,
        question_count: questionCount,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .maybeSingle();
    if (error || !data) return { data: null, error: error?.message ?? "Update failed" };
    return { data, error: null };
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      quiz_id: quizId,
      challenger_id: user.id,
      challengee_id: challengeeId,
      challenger_score: challengerScore,
      question_count: questionCount,
    })
    .select()
    .maybeSingle();

  if (error || !data) return { data: null, error: error?.message ?? "Insert failed" };
  return { data, error: null };
};

// ── Accept / Complete ──────────────────────────────────────────

/**
 * Submit the challengee's score and mark the challenge completed.
 * Call this at the end of the challenged quiz session.
 */
export const completeChallenge = async (
  challengeId: string,
  challengeeScore: number
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("challenges")
    .update({
      challengee_score: challengeeScore,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", challengeId);
  return { error: error ? error.message : null };
};

// ── Queries ────────────────────────────────────────────────────

/** Returns a single challenge by ID with all joined profile/quiz data. */
export const getChallenge = async (id: string): Promise<Challenge | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  // Join quiz title + both user profiles in parallel
  const [quizRes, profilesRes] = await Promise.all([
    supabase.from("quizzes").select("title").eq("id", data.quiz_id).maybeSingle(),
    supabase
      .from("user_profiles")
      .select("id, username, avatar_url")
      .in("id", [data.challenger_id, data.challengee_id]),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );

  return {
    ...data,
    quiz_title: quizRes.data?.title ?? "Quiz",
    challenger_username: profileMap.get(data.challenger_id)?.username ?? null,
    challenger_avatar: profileMap.get(data.challenger_id)?.avatar_url ?? null,
    challengee_username: profileMap.get(data.challengee_id)?.username ?? null,
    challengee_avatar: profileMap.get(data.challengee_id)?.avatar_url ?? null,
  };
};

/**
 * Returns all pending challenges sent TO the current user.
 * These are shown in the challenge inbox.
 */
export const getIncomingChallenges = async (): Promise<Challenge[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("challengee_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const challengerIds = [...new Set(data.map((c) => c.challenger_id))];
  const quizIds = [...new Set(data.map((c) => c.quiz_id))];

  const [profilesRes, quizzesRes] = await Promise.all([
    supabase.from("user_profiles").select("id, username, avatar_url").in("id", challengerIds),
    supabase.from("quizzes").select("id, title").in("id", quizIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const quizMap = new Map((quizzesRes.data ?? []).map((q) => [q.id, q]));

  return data.map((c) => ({
    ...c,
    quiz_title: quizMap.get(c.quiz_id)?.title ?? "Quiz",
    challenger_username: profileMap.get(c.challenger_id)?.username ?? null,
    challenger_avatar: profileMap.get(c.challenger_id)?.avatar_url ?? null,
  }));
};

/**
 * Returns completed challenges for the current user (both sides),
 * most recent first. Used for challenge history.
 */
export const getChallengeHistory = async (): Promise<Challenge[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "completed")
    .or(`challenger_id.eq.${user.id},challengee_id.eq.${user.id}`)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error || !data?.length) return [];

  const userIds = [...new Set(data.flatMap((c) => [c.challenger_id, c.challengee_id]))];
  const quizIds = [...new Set(data.map((c) => c.quiz_id))];

  const [profilesRes, quizzesRes] = await Promise.all([
    supabase.from("user_profiles").select("id, username, avatar_url").in("id", userIds),
    supabase.from("quizzes").select("id, title").in("id", quizIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const quizMap = new Map((quizzesRes.data ?? []).map((q) => [q.id, q]));

  return data.map((c) => ({
    ...c,
    quiz_title: quizMap.get(c.quiz_id)?.title ?? "Quiz",
    challenger_username: profileMap.get(c.challenger_id)?.username ?? null,
    challenger_avatar: profileMap.get(c.challenger_id)?.avatar_url ?? null,
    challengee_username: profileMap.get(c.challengee_id)?.username ?? null,
    challengee_avatar: profileMap.get(c.challengee_id)?.avatar_url ?? null,
  }));
};

/** Count of pending incoming challenges — for navbar badge. */
export const getIncomingChallengeCount = async (): Promise<number> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("challengee_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  return count ?? 0;
};

/**
 * Returns pending challenges sent BY the current user (awaiting response).
 */
export const getSentChallenges = async (): Promise<Challenge[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("challenger_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const challengeeIds = [...new Set(data.map((c) => c.challengee_id))];
  const quizIds = [...new Set(data.map((c) => c.quiz_id))];

  const [profilesRes, quizzesRes] = await Promise.all([
    supabase.from("user_profiles").select("id, username, avatar_url").in("id", challengeeIds),
    supabase.from("quizzes").select("id, title").in("id", quizIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const quizMap = new Map((quizzesRes.data ?? []).map((q) => [q.id, q]));

  return data.map((c) => ({
    ...c,
    quiz_title: quizMap.get(c.quiz_id)?.title ?? "Quiz",
    challengee_username: profileMap.get(c.challengee_id)?.username ?? null,
    challengee_avatar: profileMap.get(c.challengee_id)?.avatar_url ?? null,
  }));
};