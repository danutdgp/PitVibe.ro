/* Avatarele private folosesc URL-uri semnate cu durată limitată. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleGesture, toggleFollow } from "@/app/actions/social";
import { PostCard } from "@/components/post-card";
import { GenderForm } from "@/components/gender-form";
import { GestureButton } from "@/components/gesture-button";
import { StoriesBar } from "@/components/stories-bar";
import { getFeed } from "@/lib/posts";
import { getStoryGroups } from "@/lib/stories";
import { createClient } from "@/lib/supabase/server";

const relationshipStyles: Record<string, { label: string; icon: string; className: string }> = { single: { label: "Single", icon: "●", className: "bg-emerald-400/10 text-emerald-300" }, uncertain: { label: "Complicat", icon: "●", className: "bg-amber-400/10 text-amber-300" }, in_relationship: { label: "Combinat", icon: "🔒", className: "bg-red-400/10 text-red-300" } };
function relatedRow<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ story?: string }> }) {
  const { username } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: currentProfile }] = await Promise.all([supabase.from("profiles").select("id, username, display_name, bio, city, gender, avatar_path, visibility, relationship_status, show_relationship_status, dating_discovery_enabled, profile_interests(interests(id, label))").eq("username", username).single(), supabase.from("profiles").select("gender").eq("id", user?.id ?? "").maybeSingle()]);
  if (!profile || !user) notFound();

  const own = profile.id === user.id;
  const [{ data: followers }, { data: following }, { data: relation }, { data: avatar }, { data: profileArea }, { data: existingGesture }, storyData] = await Promise.all([
    supabase.rpc("follower_count", { target_user: profile.id }),
    supabase.rpc("following_count", { target_user: profile.id }),
    own ? Promise.resolve({ data: null }) : supabase.from("follows").select("status").eq("follower_id", user.id).eq("followed_id", profile.id).maybeSingle(),
    profile.avatar_path ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600) : Promise.resolve({ data: null }),
    supabase.from("profile_areas").select("visible, local_areas(name)").eq("user_id", profile.id).maybeSingle(),
    own ? Promise.resolve({ data: null }) : supabase.from("profile_gestures").select("sender_id").eq("sender_id", user.id).eq("recipient_id", profile.id).maybeSingle(),
    getStoryGroups(),
  ]);
  const area = profileArea ? relatedRow(profileArea.local_areas) : null;
  const canSeePosts = own || profile.visibility === "public" || relation?.status === "accepted";
  const profileStories = storyData.groups.find((group) => group.authorId === profile.id);
  const { posts } = canSeePosts ? await getFeed("pitesti", undefined, profile.id) : { posts: [] };

  return <>
    <section className="card overflow-hidden">
      <div className="h-28 bg-[radial-gradient(circle_at_20%_10%,rgba(167,139,250,.55),transparent_42%),linear-gradient(120deg,#251544,#14101f)]" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-12 flex items-end justify-between gap-4">
          {profileStories ? <Link href={`/profil/${profile.username}?story=1`} aria-label="Vezi story-ul" className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#171320] bg-gradient-to-br from-fuchsia-500 via-violet-500 to-orange-300 p-[3px]"><span className="block h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
            {avatar?.signedUrl ? <img src={avatar.signedUrl} alt={`Fotografia de profil a lui ${profile.display_name}`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-bold">{profile.display_name[0]?.toUpperCase()}</span>}
          </span></Link> : <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#171320] bg-gradient-to-br from-violet-500 to-fuchsia-500">
            {avatar?.signedUrl ? <img src={avatar.signedUrl} alt={`Fotografia de profil a lui ${profile.display_name}`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-bold">{profile.display_name[0]?.toUpperCase()}</span>}
          </div>}
          {own ? <div className="flex gap-2"><Link className="button-secondary min-h-10 px-4 text-sm" href="/salvate">Salvate</Link><Link className="button-secondary min-h-10 px-4 text-sm" href="/profil/editeaza">Editează</Link></div> : <div className="flex flex-wrap justify-end gap-2"><form action={toggleFollow}><input type="hidden" name="user_id" value={profile.id} /><input type="hidden" name="username" value={profile.username} /><button className={relation ? "button-secondary min-h-10 px-4 text-sm" : "button-primary min-h-10 px-4 text-sm"}>{relation?.status === "accepted" ? "Urmărești" : relation?.status === "pending" ? "Cerere trimisă" : profile.visibility === "private" ? "Solicită urmărirea" : "Urmărește"}</button></form>{currentProfile?.gender && profile.gender && currentProfile.gender !== profile.gender && <GestureButton action={toggleGesture} recipientId={profile.id} username={profile.username} gesture={currentProfile.gender === "male" ? "rose" : "spark"} active={Boolean(existingGesture)} />}</div>}
        </div>
        <h1 className="mt-4 text-2xl font-black">{profile.display_name}</h1>
        <p className="text-sm text-[#918a9e]">@{profile.username} · {profile.city}{area ? ` · ${area.name}` : ""}</p>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap leading-7 text-[#d8d2df]">{profile.bio}</p>}
        <div className="mt-5 flex gap-5 text-sm"><Link href={`/conexiuni/${profile.username}?tip=followers`} className="rounded-lg py-1 hover:text-violet-200"><b className="text-white">{followers ?? 0}</b> <span className="text-[#918a9e]">urmăritori</span></Link><Link href={`/conexiuni/${profile.username}?tip=following`} className="rounded-lg py-1 hover:text-violet-200"><b className="text-white">{following ?? 0}</b> <span className="text-[#918a9e]">urmăriri</span></Link></div>
        <div className="mt-5 flex flex-wrap gap-2">{profile.profile_interests.map((item) => { const interest = item.interests[0]; return interest ? <span className="rounded-full bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200" key={interest.id}>{interest.label}</span> : null; })}{profile.show_relationship_status && profile.relationship_status && relationshipStyles[profile.relationship_status] && <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${relationshipStyles[profile.relationship_status].className}`}><span aria-hidden>{relationshipStyles[profile.relationship_status].icon}</span> {relationshipStyles[profile.relationship_status].label}</span>}{profile.dating_discovery_enabled && <span className="rounded-full bg-white/7 px-3 py-1.5 text-xs text-[#c5bece]">Deschis(ă) să cunoască oameni</span>}</div>
      </div>
    </section>

    {own && !profile.gender && <GenderForm />}

    {profileStories && <StoriesBar groups={[profileStories]} currentUserId={user.id} showCreate={false} showBar={false} autoOpen={query.story === "1"} />}

    <h2 className="mt-8 text-xl font-bold">Postări</h2>
    {canSeePosts ? posts.length ? <div className="mt-4 space-y-5">{posts.map((post) => <PostCard post={post} currentUserId={user.id} key={post.id} />)}</div> : <p className="card mt-4 p-8 text-center text-[#918a9e]">Nicio postare încă.</p> : <div className="card mt-4 p-8 text-center"><p className="text-2xl">◈</p><p className="mt-3 font-bold">Acest profil este privat</p><p className="mt-2 text-sm text-[#918a9e]">Postările devin vizibile după acceptarea cererii.</p></div>}
  </>;
}
