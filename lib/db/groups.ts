import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

export type GroupRole = "owner" | "admin" | "member";

export const GROUP_COVERS = [
  "purple", "blue", "emerald", "rose", "amber", "cyan", "indigo", "slate",
] as const;
export type GroupCover = typeof GROUP_COVERS[number];

export const COVER_STYLES: Record<GroupCover, { bg: string; glow: string }> = {
  purple:  { bg: "linear-gradient(135deg, #7c3aed, #4f46e5)", glow: "147 51 234" },
  blue:    { bg: "linear-gradient(135deg, #2563eb, #0891b2)", glow: "37 99 235" },
  emerald: { bg: "linear-gradient(135deg, #059669, #0d9488)", glow: "5 150 105" },
  rose:    { bg: "linear-gradient(135deg, #e11d48, #db2777)", glow: "225 29 72" },
  amber:   { bg: "linear-gradient(135deg, #d97706, #ea580c)", glow: "217 119 6" },
  cyan:    { bg: "linear-gradient(135deg, #0891b2, #0284c7)", glow: "8 145 178" },
  indigo:  { bg: "linear-gradient(135deg, #4f46e5, #7c3aed)", glow: "79 70 229" },
  slate:   { bg: "linear-gradient(135deg, #475569, #334155)", glow: "71 85 105" },
};

export interface Group {
  id: string;
  name: string;
  subject: string | null;
  cover: GroupCover;
  join_code: string;
  owner_id: string;
  created_at: string;
  // joined
  member_count?: number;
  my_role?: GroupRole;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  // joined
  username?: string;
  avatar_url?: string | null;
  streak?: number;
  weekly_points?: number;
}

export type FeedEventType =
  | "quiz_score"
  | "streak_extended"
  | "streak_broke"
  | "library_add"
  | "assignment_complete"
  | "personal_best";

export interface FeedEvent {
  id: string;
  group_id: string;
  user_id: string;
  type: FeedEventType;
  payload: Record<string, any>;
  created_at: string;
  // joined
  username?: string;
  avatar_url?: string | null;
}

export interface LibraryItem {
  id: string;
  group_id: string;
  contributed_by: string;
  item_type: "quiz" | "deck";
  item_id: string;
  study_count: number;
  added_at: string;
  // joined
  title?: string;
  contributor_username?: string;
  member_count?: number;
}

export interface GroupAssignment {
  id: string;
  group_id: string;
  quiz_id: string;
  assigned_by: string;
  due_at: string | null;
  created_at: string;
  // joined
  quiz_title?: string;
  assigner_username?: string;
  completion_count?: number;
  member_count?: number;
  my_completion?: { score: number; completed_at: string } | null;
}

export interface AssignmentCompletion {
  user_id: string;
  score: number;
  completed_at: string;
  username?: string;
  avatar_url?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────

const randomJoinCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RET-";
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// ── Group CRUD ─────────────────────────────────────────────────

export const createGroup = async ({
  name,
  subject,
  cover,
}: {
  name: string;
  subject?: string;
  cover: GroupCover;
}): Promise<{ data: Group | null; error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  let join_code = randomJoinCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("join_code", join_code)
      .maybeSingle();
    if (!existing) break;
    join_code = randomJoinCode();
    attempts++;
  }

  const { data: group, error: groupError } = await supabase
    .rpc('create_group', {
        p_name: name,
        p_subject: subject || null,
        p_cover: cover,
        p_join_code: join_code,
    });

  if (groupError || !group) return { data: null, error: groupError?.message ?? "Failed to create group" };
  return { data: group, error: null };
};

export const joinGroupByCode = async (
  code: string
): Promise<{ data: Group | null; error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .maybeSingle();

  if (!group) return { data: null, error: "Group not found — check the code and try again" };

  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { data: group, error: null };

  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) >= 20) return { data: null, error: "Group is full (max 20 members)" };

  const { error } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (error) return { data: null, error: error.message };
  return { data: group, error: null };
};

export const leaveGroup = async (groupId: string): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  return { error: error?.message ?? null };
};

export const deleteGroup = async (groupId: string): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  return { error: error?.message ?? null };
};

export const regenerateJoinCode = async (groupId: string): Promise<{ code: string | null; error: string | null }> => {
  const supabase = createClient();
  const join_code = randomJoinCode();
  const { error } = await supabase
    .from("groups")
    .update({ join_code })
    .eq("id", groupId);
  if (error) return { code: null, error: error.message };
  return { code: join_code, error: null };
};

// ── Queries ────────────────────────────────────────────────────

export const getMyGroups = async (): Promise<Group[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const roleMap = new Map(memberships.map((m) => [m.group_id, m.role as GroupRole]));

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (!groups?.length) return [];

  const { data: counts } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.group_id, (countMap.get(row.group_id) ?? 0) + 1);
  }

  return groups.map((g) => ({
    ...g,
    member_count: countMap.get(g.id) ?? 0,
    my_role: roleMap.get(g.id) ?? "member",
  }));
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: group }, { data: membership }, { count }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle(),
    supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId),
  ]);

  if (!group) return null;

  return {
    ...group,
    member_count: count ?? 0,
    my_role: (membership?.role as GroupRole) ?? "member",
  };
};

// ── Members ────────────────────────────────────────────────────

export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const supabase = createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url, streak")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => ({
    ...m,
    username: profileMap.get(m.user_id)?.username,
    avatar_url: profileMap.get(m.user_id)?.avatar_url,
    streak: profileMap.get(m.user_id)?.streak ?? 0,
  }));
};

export const updateMemberRole = async (
  groupId: string,
  userId: string,
  role: "admin" | "member"
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
};

export const kickMember = async (
  groupId: string,
  userId: string
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
};

// ── Weekly leaderboard ─────────────────────────────────────────

export interface GroupLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: GroupRole;
  points: number;
}

export const getGroupLeaderboard = async (
  groupId: string
): Promise<GroupLeaderboardEntry[]> => {
  const supabase = createClient();

  const members = await getGroupMembers(groupId);
  if (!members.length) return [];

  const userIds = members.map((m) => m.user_id);

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const { data: activity } = await supabase
    .from("activity_log")
    .select("user_id, count")
    .in("user_id", userIds)
    .gte("activity_date", weekStartStr);

  const pointsMap = new Map<string, number>();
  for (const row of activity ?? []) {
    pointsMap.set(row.user_id, (pointsMap.get(row.user_id) ?? 0) + Number(row.count));
  }

  return members
    .map((m) => ({
      user_id: m.user_id,
      username: m.username ?? "unknown",
      avatar_url: m.avatar_url ?? null,
      role: m.role,
      points: pointsMap.get(m.user_id) ?? 0,
    }))
    .sort((a, b) => b.points - a.points);
};

// ── Feed ───────────────────────────────────────────────────────

export const getGroupFeed = async (
  groupId: string,
  limit = 50
): Promise<FeedEvent[]> => {
  const supabase = createClient();

  // Option C fallback: only return today's events even if cron hasn't cleaned up yet
  const todayStart = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const { data } = await supabase
    .from("group_feed")
    .select("*")
    .eq("group_id", groupId)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  const userIds = [...new Set(data.map((e) => e.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((e) => ({
    ...e,
    username: profileMap.get(e.user_id)?.username,
    avatar_url: profileMap.get(e.user_id)?.avatar_url,
  }));
};

export const postFeedEventToMyGroups = async (
  type: FeedEventType,
  payload: Record<string, any>
): Promise<void> => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships?.length) return;

    await supabase.from("group_feed").insert(
      memberships.map((m) => ({
        group_id: m.group_id,
        user_id: user.id,
        type,
        payload,
      }))
    );
  } catch {
    // fire-and-forget
  }
};

// ── Library ────────────────────────────────────────────────────

export const getGroupLibrary = async (groupId: string): Promise<LibraryItem[]> => {
  const supabase = createClient();

  const [{ data: items }, { count: memberCount }] = await Promise.all([
    supabase
      .from("group_library")
      .select("*")
      .eq("group_id", groupId)
      .order("added_at", { ascending: false }),
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  if (!items?.length) return [];

  const contributorIds = [...new Set(items.map((i) => i.contributed_by))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username")
    .in("id", contributorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // For items that don't have a cached title, try to fetch it as a fallback.
  // This handles items contributed before the title-caching change.
  const itemsMissingTitle = items.filter((i) => !i.title);
  if (itemsMissingTitle.length > 0) {
    const quizIds = itemsMissingTitle.filter((i) => i.item_type === "quiz").map((i) => i.item_id);
    const deckIds = itemsMissingTitle.filter((i) => i.item_type === "deck").map((i) => i.item_id);

    const [quizzesRes, decksRes] = await Promise.all([
      quizIds.length
        ? supabase.from("quizzes").select("id, title").in("id", quizIds)
        : Promise.resolve({ data: [] }),
      deckIds.length
        ? supabase.from("decks").select("id, title").in("id", deckIds)
        : Promise.resolve({ data: [] }),
    ]);

    const fallbackTitleMap = new Map([
      ...(quizzesRes.data ?? []).map((q: any) => [q.id, q.title] as [string, string]),
      ...(decksRes.data ?? []).map((d: any) => [d.id, d.title] as [string, string]),
    ]);

    return items.map((item) => ({
      ...item,
      // Prefer the stored title, fall back to live join, then "Untitled"
      title: item.title || fallbackTitleMap.get(item.item_id) || "Untitled",
      contributor_username: profileMap.get(item.contributed_by)?.username,
      member_count: memberCount ?? 1,
    }));
  }

  return items.map((item) => ({
    ...item,
    title: item.title || "Untitled",
    contributor_username: profileMap.get(item.contributed_by)?.username,
    member_count: memberCount ?? 1,
  }));
};

export const contributeToLibrary = async ({
  groupId,
  itemType,
  itemId,
}: {
  groupId: string;
  itemType: "quiz" | "deck";
  itemId: string;
}): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch the title at contribute time so it's stored on the row.
  // This means viewers never need RLS access to the original quiz/deck.
  const { data: item } = itemType === "quiz"
    ? await supabase.from("quizzes").select("title").eq("id", itemId).maybeSingle()
    : await supabase.from("decks").select("title").eq("id", itemId).maybeSingle();

  const title = item?.title ?? "Untitled";

  const { error } = await supabase.from("group_library").insert({
    group_id: groupId,
    contributed_by: user.id,
    item_type: itemType,
    item_id: itemId,
    title, // store the title directly on the row
  });

  if (error) return { error: error.message };

  // Fire feed event
  await supabase.from("group_feed").insert({
    group_id: groupId,
    user_id: user.id,
    type: "library_add",
    payload: { item_type: itemType, item_id: itemId, title },
  });

  return { error: null };
};

export const removeFromLibrary = async (libraryItemId: string): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase.from("group_library").delete().eq("id", libraryItemId);
  return { error: error?.message ?? null };
};

export const incrementLibraryStudyCount = async (libraryItemId: string): Promise<void> => {
  const supabase = createClient();
  await supabase.rpc("increment_library_study_count", { p_library_id: libraryItemId });
};

// ── Assignments ────────────────────────────────────────────────

export const getGroupAssignments = async (groupId: string): Promise<GroupAssignment[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: assignments }, { count: memberCount }] = await Promise.all([
    supabase
      .from("group_assignments")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  if (!assignments?.length) return [];

  const assignmentIds = assignments.map((a) => a.id);
  const quizIds = [...new Set(assignments.map((a) => a.quiz_id))];
  const assignerIds = [...new Set(assignments.map((a) => a.assigned_by))];

  const [quizzesRes, profilesRes, completionsRes, myCompletionsRes] = await Promise.all([
    supabase.from("quizzes").select("id, title").in("id", quizIds),
    supabase.from("user_profiles").select("id, username").in("id", assignerIds),
    supabase
      .from("group_assignment_completions")
      .select("assignment_id")
      .in("assignment_id", assignmentIds),
    supabase
      .from("group_assignment_completions")
      .select("assignment_id, score, completed_at")
      .in("assignment_id", assignmentIds)
      .eq("user_id", user.id),
  ]);

  const quizMap = new Map((quizzesRes.data ?? []).map((q) => [q.id, q.title]));
  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p.username]));

  const completionCountMap = new Map<string, number>();
  for (const row of completionsRes.data ?? []) {
    completionCountMap.set(row.assignment_id, (completionCountMap.get(row.assignment_id) ?? 0) + 1);
  }

  const myCompletionMap = new Map(
    (myCompletionsRes.data ?? []).map((c) => [c.assignment_id, { score: c.score, completed_at: c.completed_at }])
  );

  return assignments.map((a) => ({
    ...a,
    quiz_title: quizMap.get(a.quiz_id) ?? "Quiz",
    assigner_username: profileMap.get(a.assigned_by) ?? "unknown",
    completion_count: completionCountMap.get(a.id) ?? 0,
    member_count: memberCount ?? 1,
    my_completion: myCompletionMap.get(a.id) ?? null,
  }));
};

export const createAssignment = async ({
  groupId,
  quizId,
  dueAt,
}: {
  groupId: string;
  quizId: string;
  dueAt?: string | null;
}): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("group_assignments").insert({
    group_id: groupId,
    quiz_id: quizId,
    assigned_by: user.id,
    due_at: dueAt ?? null,
  });

  return { error: error?.message ?? null };
};

export const deleteAssignment = async (assignmentId: string): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { error } = await supabase.from("group_assignments").delete().eq("id", assignmentId);
  return { error: error?.message ?? null };
};

export const completeAssignment = async (
  assignmentId: string,
  score: number
): Promise<{ error: string | null }> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("group_assignment_completions").insert({
    assignment_id: assignmentId,
    user_id: user.id,
    score,
  });

  return { error: error?.message ?? null };
};

export const getAssignmentCompletions = async (
  assignmentId: string
): Promise<AssignmentCompletion[]> => {
  const supabase = createClient();

  const { data } = await supabase
    .from("group_assignment_completions")
    .select("user_id, score, completed_at")
    .eq("assignment_id", assignmentId)
    .order("score", { ascending: false });

  if (!data?.length) return [];

  const userIds = data.map((c) => c.user_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((c) => ({
    ...c,
    username: profileMap.get(c.user_id)?.username,
    avatar_url: profileMap.get(c.user_id)?.avatar_url,
  }));
};

// ── Pending assignments for dashboard ─────────────────────────

export interface PendingAssignment {
  assignment_id: string;
  group_id: string;
  group_name: string;
  quiz_id: string;
  quiz_title: string;
  due_at: string | null;
}

export const getMyPendingAssignments = async (): Promise<PendingAssignment[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: assignments } = await supabase
    .from("group_assignments")
    .select("id, group_id, quiz_id, due_at")
    .in("group_id", groupIds)
    .order("due_at", { ascending: true });

  if (!assignments?.length) return [];

  const assignmentIds = assignments.map((a) => a.id);

  const { data: completions } = await supabase
    .from("group_assignment_completions")
    .select("assignment_id")
    .in("assignment_id", assignmentIds)
    .eq("user_id", user.id);

  const completedIds = new Set((completions ?? []).map((c) => c.assignment_id));
  const pending = assignments.filter((a) => !completedIds.has(a.id));

  if (!pending.length) return [];

  const quizIds = [...new Set(pending.map((a) => a.quiz_id))];

  const [quizzesRes, groupsRes] = await Promise.all([
    supabase.from("quizzes").select("id, title").in("id", quizIds),
    supabase.from("groups").select("id, name").in("id", groupIds),
  ]);

  const quizMap = new Map((quizzesRes.data ?? []).map((q) => [q.id, q.title]));
  const groupMap = new Map((groupsRes.data ?? []).map((g) => [g.id, g.name]));

  return pending.map((a) => ({
    assignment_id: a.id,
    group_id: a.group_id,
    group_name: groupMap.get(a.group_id) ?? "Group",
    quiz_id: a.quiz_id,
    quiz_title: quizMap.get(a.quiz_id) ?? "Quiz",
    due_at: a.due_at,
  }));
};

// ── Group-aware quiz fetcher ───────────────────────────────────
// Use this in the study page instead of getQuiz when coming from
// a group context. It bypasses the is_published RLS gate by
// verifying the user is a member of a group that has this quiz
// in its library or assignments.
export const getQuizForGroup = async (quizId: string): Promise<any | null> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user is a member of any group that has this quiz
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return null;

  const groupIds = memberships.map((m) => m.group_id);

  // Check library
  const { data: libraryMatch } = await supabase
    .from("group_library")
    .select("id")
    .eq("item_type", "quiz")
    .eq("item_id", quizId)
    .in("group_id", groupIds)
    .maybeSingle();

  // Check assignments
  const { data: assignmentMatch } = await supabase
    .from("group_assignments")
    .select("id")
    .eq("quiz_id", quizId)
    .in("group_id", groupIds)
    .maybeSingle();

  if (!libraryMatch && !assignmentMatch) return null;

  // User has access via group — fetch the quiz directly
  // This requires a Supabase RLS policy that allows reading quizzes
  // where the user is a group member with access (see migration note below)
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();

  return quiz ?? null;
};