import { createClient } from "@/lib/supabase/server";

function relatedRow<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export type FeedPost = {
  id: string; content: string; created_at: string; updated_at: string; author_id: string;
  profile: { username: string; display_name: string; avatar_url: string | null };
  media: { id: string; position: number; width: number; height: number; url: string }[];
  like_count: number; comment_count: number; liked: boolean; saved: boolean;
};

export async function getFeed(scope: "pitesti" | "urmaresc" | "salvate", cursor?: string, authorId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { posts: [] as FeedPost[], nextCursor: null };
  let followedIds: string[] = [];
  if (scope === "urmaresc") {
    const { data } = await supabase.from("follows").select("followed_id").eq("follower_id", user.id).eq("status", "accepted");
    followedIds = data?.map((item) => item.followed_id) ?? [];
    if (!followedIds.length) return { posts: [] as FeedPost[], nextCursor: null };
  }
  let savedPostIds: string[] = [];
  if (scope === "salvate") {
    const { data } = await supabase.from("saved_posts").select("post_id").eq("user_id", user.id).order("created_at", { ascending: false });
    savedPostIds = data?.map((item) => item.post_id) ?? [];
    if (!savedPostIds.length) return { posts: [] as FeedPost[], nextCursor: null };
  }
  let query = supabase.from("posts").select("id, author_id, content, created_at, updated_at, profiles!posts_author_id_fkey!inner(username, display_name, avatar_path, visibility, city), post_media(id, storage_path, position, width, height), post_likes(count), comments(count)").order("created_at", { ascending: false }).order("position", { referencedTable: "post_media", ascending: true }).limit(11);
  if (cursor) query = query.lt("created_at", cursor);
  if (authorId) query = query.eq("author_id", authorId);
  else if (scope === "urmaresc") query = query.in("author_id", followedIds);
  else if (scope === "salvate") query = query.in("id", savedPostIds);
  else query = query.eq("profiles.visibility", "public").ilike("profiles.city", "Pitești");
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? []; const visibleRows = rows.slice(0, 10); const postIds = visibleRows.map((post) => post.id);
  const [{ data: likes }, { data: saves }] = postIds.length ? await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
  ]) : [{ data: [] }, { data: [] }];
  const mediaPaths = visibleRows.flatMap((post) => post.post_media.map((media) => media.storage_path));
  const avatarPaths = [...new Set(visibleRows.map((post) => relatedRow(post.profiles)?.avatar_path).filter(Boolean))] as string[];
  const [{ data: mediaUrls }, { data: avatarUrls }] = await Promise.all([
    mediaPaths.length ? supabase.storage.from("post-media").createSignedUrls(mediaPaths, 3600) : { data: [] },
    avatarPaths.length ? supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] },
  ]);
  const urlMap = new Map([...(mediaUrls ?? []), ...(avatarUrls ?? [])].map((item) => [item.path, item.signedUrl]));
  const likedIds = new Set((likes ?? []).map((item) => item.post_id)); const savedIds = new Set((saves ?? []).map((item) => item.post_id));
  const posts: FeedPost[] = visibleRows.flatMap((post) => { const profile = relatedRow(post.profiles); if (!profile) return []; return [{
    id: post.id, author_id: post.author_id, content: post.content, created_at: post.created_at, updated_at: post.updated_at,
    profile: { username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_path ? urlMap.get(profile.avatar_path) ?? null : null },
    media: post.post_media.map((media) => ({ id: media.id, position: media.position, width: media.width, height: media.height, url: urlMap.get(media.storage_path) ?? "" })).filter((media) => media.url),
    like_count: post.post_likes[0]?.count ?? 0, comment_count: post.comments[0]?.count ?? 0, liked: likedIds.has(post.id), saved: savedIds.has(post.id),
  }]; });
  return { posts, nextCursor: rows.length > 10 ? visibleRows.at(-1)?.created_at ?? null : null };
}

export async function getPost(postId: string) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const { data: post, error } = await supabase.from("posts").select("id, author_id, content, created_at, updated_at, profiles!posts_author_id_fkey!inner(username, display_name, avatar_path), post_media(id, storage_path, position, width, height), post_likes(count), comments(count)").eq("id", postId).order("position", { referencedTable: "post_media", ascending: true }).single();
  if (error || !post) return null;
  const profile = relatedRow(post.profiles); if (!profile) return null;
  const [{ data: liked }, { data: saved }] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
    supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle(),
  ]);
  const [{ data: mediaUrls }, { data: avatarUrl }] = await Promise.all([
    post.post_media.length ? supabase.storage.from("post-media").createSignedUrls(post.post_media.map((media) => media.storage_path), 3600) : { data: [] },
    profile.avatar_path ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600) : { data: null },
  ]);
  const urlMap = new Map((mediaUrls ?? []).map((item) => [item.path, item.signedUrl]));
  const result: FeedPost = { id: post.id, author_id: post.author_id, content: post.content, created_at: post.created_at, updated_at: post.updated_at, profile: { username: profile.username, display_name: profile.display_name, avatar_url: avatarUrl?.signedUrl ?? null }, media: post.post_media.map((media) => ({ id: media.id, position: media.position, width: media.width, height: media.height, url: urlMap.get(media.storage_path) ?? "" })).filter((media) => media.url), like_count: post.post_likes[0]?.count ?? 0, comment_count: post.comments[0]?.count ?? 0, liked: Boolean(liked), saved: Boolean(saved) };
  return result;
}
