import type { SupabaseClient } from "@supabase/supabase-js";

export interface EntryMeta {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  text: string;
  featuredImage: string;
  images: string[]; // filenames stored in DB, full URLs constructed at read time
  createdAt: string;
  updatedAt: string;
  // Aggregated
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  // Author info
  authorName: string;
  authorAvatar: string;
}

export function generateId(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function getImageUrl(userId: string, entryId: string, filename: string): string {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${userId}/${entryId}/${filename}`;
}

export async function getAllEntries(
  supabase: SupabaseClient,
  currentUserId?: string,
  filterUserId?: string
): Promise<EntryMeta[]> {
  let query = supabase
    .from("entries")
    .select(`
      *,
      likes (user_id),
      comments (id)
    `)
    .order("created_at", { ascending: false });

  if (filterUserId) {
    query = query.eq("user_id", filterUserId);
  }

  const { data: entries, error } = await query;

  if (error) throw error;
  if (!entries) return [];

  // Fetch profiles for all unique user_ids
  const userIds = Array.from(new Set(entries.map((e) => e.user_id)));
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return entries.map((e) => {
    const profile = profileMap.get(e.user_id);
    return {
      id: e.id,
      user_id: e.user_id,
      date: e.date,
      text: e.text,
      featuredImage: e.featured_image,
      images: e.images || [],
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      likeCount: e.likes?.length || 0,
      commentCount: e.comments?.length || 0,
      likedByMe: currentUserId
        ? e.likes?.some((l: { user_id: string }) => l.user_id === currentUserId) || false
        : false,
      authorName: profile?.display_name || "",
      authorAvatar: profile?.avatar_url || "",
    };
  });
}

export async function getEntry(
  supabase: SupabaseClient,
  id: string,
  currentUserId?: string
): Promise<EntryMeta | null> {
  const { data: e, error } = await supabase
    .from("entries")
    .select(`
      *,
      likes (user_id),
      comments (id)
    `)
    .eq("id", id)
    .single();

  if (error || !e) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", e.user_id)
    .single();

  return {
    id: e.id,
    user_id: e.user_id,
    date: e.date,
    text: e.text,
    featuredImage: e.featured_image,
    images: e.images || [],
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    likeCount: e.likes?.length || 0,
    commentCount: e.comments?.length || 0,
    likedByMe: currentUserId
      ? e.likes?.some((l: { user_id: string }) => l.user_id === currentUserId) || false
      : false,
    authorName: profile?.display_name || "",
    authorAvatar: profile?.avatar_url || "",
  };
}

export interface Comment {
  id: string;
  entryId: string;
  userId: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string;
}

export async function getComments(
  supabase: SupabaseClient,
  entryId: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (display_name, avatar_url)
    `)
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    entryId: c.entry_id,
    userId: c.user_id,
    body: c.body,
    createdAt: c.created_at,
    authorName: c.profiles?.display_name || "",
    authorAvatar: c.profiles?.avatar_url || "",
  }));
}
