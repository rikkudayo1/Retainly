import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  explanation?: string;
}

export interface DBQuizSession {
  id: string;
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  score: number;
  total: number;
  created_at: string;
  source_published_quiz_id: string | null;
  source_creator_username: string | null;
  source_creator_avatar: string | null;
}

export interface PublishedQuiz {
  id: string;
  quiz_id: string;
  user_id: string;
  title: string;
  description: string;
  add_count: number;
  star_count: number;
  question_count: number;
  questions: QuizQuestion[]; // snapshot stored at publish time — avoids RLS on quiz_sessions
  created_at: string;
  is_starred: boolean;
  username: string | null;
  avatar_url: string | null;
  is_own: boolean;
}

// ── Quiz Sessions ──────────────────────────────────────────────

export const saveQuizSession = async (
  title: string,
  questions: QuizQuestion[],
  score: number,
  total: number
): Promise<DBQuizSession | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({ title, questions, score, total, user_id: user.id })
    .select()
    .single();

  if (error) return null;
  return data;
};

export const getQuizSessions = async (): Promise<DBQuizSession[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
};

export const getQuizSession = async (id: string): Promise<DBQuizSession | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
};

export const deleteQuizSession = async (id: string): Promise<void> => {
  const supabase = createClient();
  await supabase.from("quiz_sessions").delete().eq("id", id);
};

export const updateQuizTitle = async (id: string, title: string): Promise<boolean> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ title })
    .eq("id", id);
  return !error;
};

export const updateQuizQuestion = async (
  quizId: string,
  questionIndex: number,
  data: Partial<QuizQuestion>,
  allQuestions: QuizQuestion[]
): Promise<boolean> => {
  const supabase = createClient();
  const updated = allQuestions.map((q, i) =>
    i === questionIndex ? { ...q, ...data } : q
  );
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ questions: updated })
    .eq("id", quizId);
  return !error;
};

export const deleteQuizQuestion = async (
  quizId: string,
  questionIndex: number,
  allQuestions: QuizQuestion[]
): Promise<boolean> => {
  const supabase = createClient();
  const updated = allQuestions.filter((_, i) => i !== questionIndex);
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ questions: updated })
    .eq("id", quizId);
  return !error;
};

export const addQuizQuestion = async (
  quizId: string,
  question: QuizQuestion,
  allQuestions: QuizQuestion[]
): Promise<boolean> => {
  const supabase = createClient();
  const updated = [...allQuestions, question];
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ questions: updated })
    .eq("id", quizId);
  return !error;
};

// ── Publishing ─────────────────────────────────────────────────

export const publishQuiz = async (
  quizId: string,
  title: string,
  description: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("published_quizzes")
    .select("id")
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (existing) return { error: "Already published" };

  // Read questions while we still own the session (RLS allows this here).
  // We snapshot the full questions array onto published_quizzes so that
  // other users can add the quiz without ever reading quiz_sessions (which
  // RLS blocks for rows they don't own — the root cause of the 406 error).
  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("questions")
    .eq("id", quizId)
    .single();

  const questions: QuizQuestion[] = session?.questions ?? [];
  const questionCount = questions.length;

  const { data: inserted, error: insertError } = await supabase
    .from("published_quizzes")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      title,
      description,
      questions,
      question_count: questionCount,
    })
    .select("id")
    .single();

  if (insertError || !inserted) return { error: insertError?.message ?? "Insert failed" };

  await supabase
    .from("quiz_sessions")
    .update({ source_published_quiz_id: inserted.id })
    .eq("id", quizId);

  return { error: null };
};

export const unpublishQuiz = async (publishedQuizId: string): Promise<void> => {
  const supabase = createClient();

  await supabase
    .from("quiz_sessions")
    .update({ source_published_quiz_id: null })
    .eq("source_published_quiz_id", publishedQuizId);

  await supabase.from("published_quizzes").delete().eq("id", publishedQuizId);
};

// ── Public quizzes ─────────────────────────────────────────────

export const getPublishedQuizzes = async (
  search = "",
  sortBy = "newest",
  page = 1,
  limit = 8
): Promise<PublishedQuiz[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("published_quizzes")
    .select("*")
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike("title", `%${search}%`);

  if (sortBy === "stars") query = query.order("star_count", { ascending: false });
  else if (sortBy === "popular") query = query.order("add_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];

  // Fetch profiles separately
  const userIds = [...new Set(data.map((d: any) => d.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.id, p])
  );

  // Get starred ids
  let starredIds: string[] = [];
  if (user) {
    const { data: stars } = await supabase
      .from("quiz_stars")
      .select("published_quiz_id")
      .eq("user_id", user.id);
    starredIds = (stars ?? []).map((s) => s.published_quiz_id);
  }

  return data.map((d: any) => ({
    id: d.id,
    quiz_id: d.quiz_id,
    user_id: d.user_id,
    title: d.title,
    description: d.description,
    add_count: d.add_count,
    star_count: d.star_count,
    created_at: d.created_at,
    is_starred: starredIds.includes(d.id),
    username: profileMap.get(d.user_id)?.username ?? null,
    avatar_url: profileMap.get(d.user_id)?.avatar_url ?? null,
    question_count: d.question_count ?? 0,
    questions: d.questions ?? [],
    is_own: user ? d.user_id === user.id : false,
  }));
};

export const getPublishedQuizzesCount = async (search = ""): Promise<number> => {
  const supabase = createClient();
  let query = supabase
    .from("published_quizzes")
    .select("id", { count: "exact", head: true });
  if (search) query = query.ilike("title", `%${search}%`);
  const { count } = await query;
  return count ?? 0;
};

export const toggleQuizStar = async (
  publishedQuizId: string,
  isCurrentlyStarred: boolean
): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return isCurrentlyStarred;

  if (isCurrentlyStarred) {
    const { error } = await supabase
      .from("quiz_stars")
      .delete()
      .eq("published_quiz_id", publishedQuizId)
      .eq("user_id", user.id);
    if (error) return true;
    await supabase.rpc("decrement_quiz_star_count", { p_quiz_id: publishedQuizId });
    return false;
  } else {
    const { error } = await supabase
      .from("quiz_stars")
      .insert({ published_quiz_id: publishedQuizId, user_id: user.id });
    if (error) return false;
    await supabase.rpc("increment_quiz_star_count", { p_quiz_id: publishedQuizId });
    return true;
  }
};

export const addPublishedQuizToMySessions = async (
  publishedQuizId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Read everything from published_quizzes (publicly readable) — we never
  // touch quiz_sessions of another user, which RLS blocks with a 406 error.
  const { data: pub, error: pubError } = await supabase
    .from("published_quizzes")
    .select("title, user_id, questions, question_count")
    .eq("id", publishedQuizId)
    .single();

  if (pubError || !pub) return { error: "Quiz not found" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, avatar_url")
    .eq("id", pub.user_id)
    .single();

  const { error: insertError } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      title: pub.title,
      questions: pub.questions,
      score: 0,
      total: pub.question_count,
      source_published_quiz_id: publishedQuizId,
      source_creator_username: profile?.username ?? null,
      source_creator_avatar: profile?.avatar_url ?? null,
    });

  if (insertError) return { error: "Failed to save quiz" };

  await supabase.rpc("increment_quiz_add_count", { p_quiz_id: publishedQuizId });

  return { error: null };
};

export const getStarredQuizIds = async (): Promise<string[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quiz_stars")
    .select("published_quiz_id")
    .eq("user_id", user.id);

  if (error) return [];
  return data.map((s) => s.published_quiz_id);
};

export const getMyPublishedQuizzes = async (): Promise<PublishedQuiz[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("published_quizzes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return data.map((d: any) => ({
    id: d.id,
    quiz_id: d.quiz_id,
    user_id: d.user_id,
    title: d.title,
    description: d.description,
    add_count: d.add_count,
    star_count: d.star_count,
    created_at: d.created_at,
    is_starred: false,
    username: profile?.username ?? null,
    avatar_url: profile?.avatar_url ?? null,
    question_count: d.question_count ?? 0,
    questions: d.questions ?? [],
    is_own: true,
  }));
};