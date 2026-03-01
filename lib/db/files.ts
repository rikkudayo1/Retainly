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

// ── Functions ──────────────────────────────────────────────────

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