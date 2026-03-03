import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string; // full answer text, NOT a letter label
  explanation?: string;
}

export interface Quiz {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  question_count: number;
  is_published: boolean;
  published_at: string | null;
  add_count: number;
  star_count: number;
  created_at: string;
  updated_at: string;
  // Joined / client-side only
  is_starred?: boolean;
  is_added?: boolean;        // true if the current user has an attempt row for this quiz
  username?: string | null;
  avatar_url?: string | null;
  // Score for the current user (joined from quiz_attempts)
  user_score?: number | null;
}

// Only real DB columns — keeps client-side fields out of UPDATE payloads
type QuizDbUpdate = Partial<
  Pick<
    Quiz,
    | "title"
    | "description"
    | "questions"
    | "question_count"
    | "is_published"
    | "published_at"
    | "updated_at"
  >
>;

// Lean score record — no quiz data duplicated here
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

// ── Quizzes ────────────────────────────────────────────────────

export const createQuiz = async (
  title: string,
  questions: QuizQuestion[],
  description = ""
): Promise<{ data: Quiz | null; error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      creator_id: user.id,
      title,
      description,
      questions,
      question_count: questions.length,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
};

export const getQuiz = async (id: string): Promise<Quiz | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  if (user) {
    const { data: star } = await supabase
      .from("quiz_stars")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("quiz_id", id)
      .maybeSingle();
    data.is_starred = !!star;
  }

  return data;
};

// Returns all quizzes the current user has saved (has a quiz_attempt row for),
// with their best score joined in.
export const getMyQuizCollection = async (): Promise<Quiz[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get the user's attempt rows (just ids + scores)
  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score")
    .eq("user_id", user.id);

  if (attemptsError || !attempts?.length) return [];

  const quizIds = attempts.map((a) => a.quiz_id);
  const scoreMap = new Map(attempts.map((a) => [a.quiz_id, a.score]));

  // Fetch the full quiz rows
  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("*")
    .in("id", quizIds)
    .order("created_at", { ascending: false });

  if (quizzesError || !quizzes) return [];

  // Fetch creator profiles
  const creatorIds = [...new Set(quizzes.map((q) => q.creator_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", creatorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return quizzes.map((q) => ({
    ...q,
    user_score: scoreMap.get(q.id) ?? null,
    username: profileMap.get(q.creator_id)?.username ?? null,
    avatar_url: profileMap.get(q.creator_id)?.avatar_url ?? null,
  }));
};

export const getMyQuizzes = async (): Promise<Quiz[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
};

export const getPublishedQuizzes = async (
  search = "",
  sortBy = "newest",
  sortDir: "asc" | "desc" = "desc",
  page = 1,
  limit = 8
): Promise<Quiz[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("quizzes")
    .select("*")
    .eq("is_published", true)
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike("title", `%${search}%`);

  const orderOptions = { ascending: sortDir === "asc" };
  if (sortBy === "stars") query = query.order("star_count", orderOptions);
  else if (sortBy === "popular") query = query.order("add_count", orderOptions);
  else query = query.order("created_at", orderOptions);

  const { data, error } = await query;
  if (error || !data) return [];

  let starredIds: string[] = [];
  let addedQuizIds: string[] = [];

  if (user) {
    const { data: stars } = await supabase
      .from("quiz_stars")
      .select("quiz_id")
      .eq("user_id", user.id);
    starredIds = (stars ?? []).map((s) => s.quiz_id);

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id")
      .eq("user_id", user.id);
    addedQuizIds = (attempts ?? []).map((a) => a.quiz_id);
  }

  const creatorIds = [...new Set(data.map((d) => d.creator_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", creatorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((d) => ({
    ...d,
    is_starred: starredIds.includes(d.id),
    is_added: addedQuizIds.includes(d.id),
    username: profileMap.get(d.creator_id)?.username ?? null,
    avatar_url: profileMap.get(d.creator_id)?.avatar_url ?? null,
  }));
};

export const getPublishedQuizzesCount = async (search = ""): Promise<number> => {
  const supabase = createClient();
  let query = supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  if (search) query = query.ilike("title", `%${search}%`);
  const { count } = await query;
  return count ?? 0;
};

export const updateQuiz = async (
  id: string,
  data: QuizDbUpdate
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ? error.message : null };
};

// ON DELETE CASCADE handles quiz_attempts; we still manually clear quiz_stars
export const deleteQuiz = async (id: string): Promise<{ error: string | null }> => {
  const supabase = createClient();

  const { error: starsError } = await supabase
    .from("quiz_stars")
    .delete()
    .eq("quiz_id", id);
  if (starsError) return { error: starsError.message };

  const { error: attemptsError } = await supabase
    .from("quiz_attempts")
    .delete()
    .eq("quiz_id", id);
  if (attemptsError) return { error: attemptsError.message };

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", id);
  return { error: error ? error.message : null };
};

export const publishQuiz = async (
  id: string,
  description: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ is_published: true, description, published_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ? error.message : null };
};

export const unpublishQuiz = async (id: string): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ is_published: false, published_at: null })
    .eq("id", id);
  return { error: error ? error.message : null };
};

export const toggleQuizStar = async (
  quizId: string,
  isCurrentlyStarred: boolean
): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return isCurrentlyStarred;

  if (isCurrentlyStarred) {
    const { error } = await supabase
      .from("quiz_stars")
      .delete()
      .eq("quiz_id", quizId)
      .eq("user_id", user.id);
    if (error) return true;
    await supabase.rpc("decrement_quiz_star_count", { p_quiz_id: quizId });
    return false;
  } else {
    const { error } = await supabase
      .from("quiz_stars")
      .insert({ quiz_id: quizId, user_id: user.id });
    if (error) return false;
    await supabase.rpc("increment_quiz_star_count", { p_quiz_id: quizId });
    return true;
  }
};

// Saves a quiz to the user's collection by creating a quiz_attempt row
export const addQuizToCollection = async (
  quizId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check they don't already have it
  const { data: existing } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (existing) return { error: null }; // already in collection, not an error

  const { error } = await supabase
    .from("quiz_attempts")
    .insert({ user_id: user.id, quiz_id: quizId, score: 0 });

  if (error) return { error: error.message };

  await supabase.rpc("increment_quiz_add_count", { p_quiz_id: quizId });
  return { error: null };
};

// ── Quiz Attempts ──────────────────────────────────────────────

// Upserts a score for the current user on a quiz.
// Call this at the end of a study session.
export const saveQuizScore = async (
  quizId: string,
  score: number
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("quiz_attempts")
    .upsert(
      { user_id: user.id, quiz_id: quizId, score, updated_at: new Date().toISOString() },
      { onConflict: "user_id,quiz_id" }
    );

  return { error: error ? error.message : null };
};

export const getQuizAttempt = async (
  userId: string,
  quizId: string
): Promise<QuizAttempt | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (error) return null;
  return data;
};

export const deleteQuizAttempt = async (
  quizId: string
): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("quiz_attempts")
    .delete()
    .eq("user_id", user.id)
    .eq("quiz_id", quizId);

  return !error;
};