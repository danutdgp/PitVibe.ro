import { createClient } from "@/lib/supabase/server";

export type StoryItem = { id: string; mediaUrl: string; mediaType: "image" | "video"; createdAt: string; expiresAt: string; viewed: boolean; viewCount: number };
export type StoryGroup = { authorId: string; username: string; displayName: string; avatarUrl: string | null; stories: StoryItem[]; allViewed: boolean };

function relatedRow<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getStoryGroups() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { groups: [] as StoryGroup[], currentUserId: "" };

  const { data, error } = await supabase.from("stories").select("id, author_id, media_path, media_type, created_at, expires_at, profiles!stories_author_id_fkey!inner(username, display_name, avatar_path), story_views(count)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(100);
  if (error) throw error;
  const rows = data ?? [];
  const storyIds = rows.map((story) => story.id);
  const { data: views } = storyIds.length ? await supabase.from("story_views").select("story_id").eq("viewer_id", user.id).in("story_id", storyIds) : { data: [] };
  const viewedIds = new Set((views ?? []).map((view) => view.story_id));
  const mediaPaths = rows.map((story) => story.media_path);
  const avatarPaths = [...new Set(rows.map((story) => relatedRow(story.profiles)?.avatar_path).filter(Boolean))] as string[];
  const [{ data: mediaUrls }, { data: avatarUrls }] = await Promise.all([
    mediaPaths.length ? supabase.storage.from("story-media").createSignedUrls(mediaPaths, 3600) : { data: [] },
    avatarPaths.length ? supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] },
  ]);
  const mediaMap = new Map((mediaUrls ?? []).map((item) => [item.path, item.signedUrl]));
  const avatarMap = new Map((avatarUrls ?? []).map((item) => [item.path, item.signedUrl]));
  const groupMap = new Map<string, StoryGroup>();

  for (const story of rows) {
    const profile = relatedRow(story.profiles);
    const mediaUrl = mediaMap.get(story.media_path);
    if (!profile || !mediaUrl) continue;
    const group: StoryGroup = groupMap.get(story.author_id) ?? { authorId: story.author_id, username: profile.username, displayName: profile.display_name, avatarUrl: profile.avatar_path ? avatarMap.get(profile.avatar_path) ?? null : null, stories: [], allViewed: true };
    const viewed = story.author_id === user.id || viewedIds.has(story.id);
    group.stories.push({ id: story.id, mediaUrl, mediaType: story.media_type, createdAt: story.created_at, expiresAt: story.expires_at, viewed, viewCount: story.story_views[0]?.count ?? 0 });
    group.allViewed = group.allViewed && viewed;
    groupMap.set(story.author_id, group);
  }

  const groups = [...groupMap.values()].sort((a, b) => Number(b.authorId === user.id) - Number(a.authorId === user.id) || Number(a.allViewed) - Number(b.allViewed));
  return { groups, currentUserId: user.id };
}
