/* Avatarele private folosesc URL-uri semnate cu durată limitată. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleFollow } from "@/app/actions/social";
import { PostCard } from "@/components/post-card";
import { getFeed } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

const relationshipLabels: Record<string, string> = { single: "Single", uncertain: "Incert", in_relationship: "Combinat" };
function relatedRow<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name, bio, city, avatar_path, visibility, relationship_status, show_relationship_status, dating_discovery_enabled, profile_interests(interests(id, label))").eq("username", username).single();
  if (!profile || !user) notFound();

  const own = profile.id === user.id;
  const [{ data: followers }, { data: following }, { data: relation }, { data: avatar }, { data: profileArea }] = await Promise.all([
    supabase.rpc("follower_count", { target_user: profile.id }),
    supabase.rpc("following_count", { target_user: profile.id }),
    own ? Promise.resolve({ data: null }) : supabase.from("follows").select("status").eq("follower_id", user.id).eq("followed_id", profile.id).maybeSingle(),
    profile.avatar_path ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600) : Promise.resolve({ data: null }),
    supabase.from("profile_areas").select("visible, local_areas(name)").eq("user_id", profile.id).maybeSingle(),
  ]);
  const area = profileArea ? relatedRow(profileArea.local_areas) : null;
  const canSeePosts = own || profile.visibility === "public" || relation?.status === "accepted";
  const { posts } = canSeePosts ? await getFeed("pitesti", undefined, profile.id) : { posts: [] };

  return <>
    <section className="card overflow-hidden">
      <div className="h-28 bg-[radial-gradient(circle_at_20%_10%,rgba(167,139,250,.55),transparent_42%),linear-gradient(120deg,#251544,#14101f)]" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-12 flex items-end justify-between gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#171320] bg-gradient-to-br from-violet-500 to-fuchsia-500">
            {avatar?.signedUrl ? <img src={avatar.signedUrl} alt={`Fotografia de profil a lui ${profile.display_name}`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-bold">{profile.display_name[0]?.toUpperCase()}</span>}
          </div>
          {own ? <div className="flex gap-2"><Link className="button-secondary min-h-10 px-4 text-sm" href="/salvate">Salvate</Link><Link className="button-secondary min-h-10 px-4 text-sm" href="/profil/editeaza">Editează</Link></div> : <form action={toggleFollow}><input type="hidden" name="user_id" value={profile.id} /><input type="hidden" name="username" value={profile.username} /><button className={relation ? "button-secondary min-h-10 px-4 text-sm" : "button-primary min-h-10 px-4 text-sm"}>{relation?.status === "accepted" ? "Urmărești" : relation?.status === "pending" ? "Cerere trimisă" : profile.visibility === "private" ? "Solicită urmărirea" : "Urmărește"}</button></form>}
        </div>
        <h1 className="mt-4 text-2xl font-black">{profile.display_name}</h1>
        <p className="text-sm text-[#918a9e]">@{profile.username} · {profile.city}{area ? ` · ${area.name}` : ""}</p>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap leading-7 text-[#d8d2df]">{profile.bio}</p>}
        <div className="mt-5 flex gap-5 text-sm"><span><b className="text-white">{followers ?? 0}</b> <span className="text-[#918a9e]">urmăritori</span></span><span><b className="text-white">{following ?? 0}</b> <span className="text-[#918a9e]">urmărește</span></span></div>
        <div className="mt-5 flex flex-wrap gap-2">{profile.profile_interests.map((item) => { const interest = item.interests[0]; return interest ? <span className="rounded-full bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200" key={interest.id}>{interest.label}</span> : null; })}{profile.show_relationship_status && profile.relationship_status && <span className="rounded-full bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200">{relationshipLabels[profile.relationship_status]}</span>}{profile.dating_discovery_enabled && <span className="rounded-full bg-white/7 px-3 py-1.5 text-xs text-[#c5bece]">Deschis(ă) să cunoască oameni</span>}</div>
      </div>
    </section>

    <h2 className="mt-8 text-xl font-bold">Postări</h2>
    {canSeePosts ? posts.length ? <div className="mt-4 space-y-5">{posts.map((post) => <PostCard post={post} currentUserId={user.id} key={post.id} />)}</div> : <p className="card mt-4 p-8 text-center text-[#918a9e]">Nicio postare încă.</p> : <div className="card mt-4 p-8 text-center"><p className="text-2xl">◈</p><p className="mt-3 font-bold">Acest profil este privat</p><p className="mt-2 text-sm text-[#918a9e]">Postările devin vizibile după acceptarea cererii.</p></div>}
  </>;
}
