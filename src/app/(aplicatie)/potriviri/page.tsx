import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Potrivirile mele" };

type Profile = { id: string; username: string; display_name: string; bio: string; avatar_path: string | null };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: matches } = await supabase.from("profile_matches").select("user_one, user_two, created_at").or(`user_one.eq.${user.id},user_two.eq.${user.id}`).order("created_at", { ascending: false });
  const otherIds = (matches ?? []).map((match) => match.user_one === user.id ? match.user_two : match.user_one);
  const { data: conversations } = otherIds.length ? await supabase.from("conversations").select("id, requester_id, recipient_id, status").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted") : { data: [] };
  const conversationMap = new Map((conversations ?? []).map((conversation) => [conversation.requester_id === user.id ? conversation.recipient_id : conversation.requester_id, conversation.id]));
  const { data: profiles } = otherIds.length ? await supabase.from("profiles").select("id, username, display_name, bio, avatar_path").in("id", otherIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as Profile]));
  const avatarPaths = (profiles ?? []).map((profile) => profile.avatar_path).filter(Boolean) as string[];
  const { data: avatarUrls } = avatarPaths.length ? await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600) : { data: [] };
  const avatarMap = new Map((avatarUrls ?? []).map((item) => [item.path, item.signedUrl]));

  return <><div><p className="text-sm font-semibold text-violet-300">Conexiuni reciproce</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Potrivirile mele</h1><p className="mt-3 leading-7 text-[#aaa4b8]">Aici găsești persoanele care au acceptat gestul și cu care poți vorbi.</p></div><section className="mt-7 space-y-4">{(matches ?? []).map((match) => { const id = match.user_one === user.id ? match.user_two : match.user_one; const profile = profileMap.get(id); if (!profile) return null; const avatar = profile.avatar_path ? avatarMap.get(profile.avatar_path) : null; const conversationId = conversationMap.get(id); return <article className="card flex items-center gap-4 p-5" key={id}><Link href={`/profil/${profile.username}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xl font-bold">{profile.display_name[0]?.toUpperCase()}</span>}</Link><div className="min-w-0 flex-1"><Link href={`/profil/${profile.username}`} className="font-bold hover:text-violet-300">{profile.display_name}</Link><p className="mt-1 truncate text-sm text-[#827b8e]">{profile.bio || "Conexiune reciprocă"}</p></div>{conversationId && <Link href={`/mesaje/${conversationId}`} className="button-primary shrink-0 px-4 text-sm">Mesaj</Link>}</article>; })}{!matches?.length && <div className="card p-10 text-center"><p className="text-3xl">♡</p><h2 className="mt-3 text-xl font-bold">Încă nu ai potriviri</h2><p className="mt-2 text-sm text-[#aaa4b8]">Când cineva acceptă trandafirul sau scânteia ta, match-ul va apărea aici.</p><Link href="/descopera" className="button-secondary mt-5">Descoperă persoane</Link></div>}</section></>;
}
