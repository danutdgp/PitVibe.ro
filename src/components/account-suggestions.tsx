/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { toggleFollow } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/server";

function dailyScore(id: string) {
  const seed = new Date().toISOString().slice(0, 10);
  let score = 2166136261;
  for (const character of `${seed}:${id}`) score = Math.imul(score ^ character.charCodeAt(0), 16777619);
  return score >>> 0;
}

export async function AccountSuggestions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: following }, { data: profiles }] = await Promise.all([
    supabase.from("follows").select("followed_id").eq("follower_id", user.id),
    supabase.from("profiles").select("id, username, display_name, avatar_path, visibility").neq("id", user.id).is("suspended_at", null).limit(30),
  ]);
  const followedIds = new Set((following ?? []).map((item) => item.followed_id));
  const suggestions = (profiles ?? []).filter((profile) => !followedIds.has(profile.id)).sort((a, b) => dailyScore(a.id) - dailyScore(b.id)).slice(0, 3);
  if (!suggestions.length) return null;

  const avatarPaths = suggestions.map((profile) => profile.avatar_path).filter(Boolean) as string[];
  const { data: avatarUrls } = avatarPaths.length ? await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] };
  const avatarMap = new Map((avatarUrls ?? []).map((item) => [item.path, item.signedUrl]));

  return <section className="card mt-6 p-5">
    <div className="flex items-center justify-between"><h2 className="font-bold">Sugestii pentru tine</h2><Link href="/descopera" className="text-xs font-semibold text-violet-300 hover:text-violet-200">Vezi mai mult</Link></div>
    <div className="mt-4 space-y-4">{suggestions.map((profile) => { const avatar = profile.avatar_path ? avatarMap.get(profile.avatar_path) : null; return <div className="flex items-center gap-3" key={profile.id}>
      <Link href={`/profil/${profile.username}`} className="flex min-w-0 flex-1 items-center gap-3"><span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold text-white">{profile.display_name[0]?.toUpperCase()}</span>}</span><span className="min-w-0"><strong className="block truncate text-sm">{profile.display_name}</strong><span className="block truncate text-xs text-[#918a9e]">@{profile.username}</span></span></Link>
      <form action={toggleFollow}><input type="hidden" name="user_id" value={profile.id} /><input type="hidden" name="username" value={profile.username} /><button className="rounded-full px-3 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-400/10 hover:text-violet-200">{profile.visibility === "private" ? "Solicită" : "Urmărește"}</button></form>
    </div>; })}</div>
  </section>;
}
