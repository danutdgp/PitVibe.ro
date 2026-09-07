/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function relatedRow<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export default async function StoryViewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: story } = await supabase.from("stories").select("id, author_id").eq("id", id).maybeSingle();
  if (!story || !user || story.author_id !== user.id) notFound();

  const { data: views } = await supabase.from("story_views").select("viewer_id, viewed_at, profiles!story_views_viewer_id_fkey(username, display_name, avatar_path)").eq("story_id", id).neq("viewer_id", user.id).order("viewed_at", { ascending: false });
  const avatarPaths = [...new Set((views ?? []).map((view) => relatedRow(view.profiles)?.avatar_path).filter(Boolean))] as string[];
  const { data: avatarUrls } = avatarPaths.length ? await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] };
  const avatarMap = new Map((avatarUrls ?? []).map((item) => [item.path, item.signedUrl]));

  return <><Link href="/acasa" className="text-sm font-semibold text-violet-300">← Înapoi la feed</Link><h1 className="mt-3 text-3xl font-black">Vizualizări</h1><p className="mt-2 text-sm text-[#918a9e]">Persoanele care au deschis acest story.</p><div className="card mt-7 divide-y divide-white/8 px-5">{views?.map((view) => { const profile = relatedRow(view.profiles); if (!profile) return null; const avatar = profile.avatar_path ? avatarMap.get(profile.avatar_path) : null; return <Link href={`/profil/${profile.username}`} key={view.viewer_id} className="flex items-center gap-3 py-4"><span className="h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold">{profile.display_name[0]?.toUpperCase()}</span>}</span><span><strong className="block">{profile.display_name}</strong><span className="text-xs text-[#918a9e]">@{profile.username}</span></span><time className="ml-auto text-xs text-[#777181]">{new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(new Date(view.viewed_at))}</time></Link>; })}{!views?.length && <p className="py-10 text-center text-[#918a9e]">Nicio vizualizare încă.</p>}</div></>;
}
