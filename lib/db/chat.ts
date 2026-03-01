import { createClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────

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
  attached_image_name?: string | null;
  created_at: string;
}

// ── Functions ──────────────────────────────────────────────────

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
  attachedImageName?: string | null,
): Promise<ChatMessage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      attached_file_name: attachedFileName ?? null,
      attached_image_name: attachedImageName ?? null,
    })
    .select()
    .single();

  if (error) return null;
  return data;
}