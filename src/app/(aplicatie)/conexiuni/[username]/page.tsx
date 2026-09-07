/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Connection = { user_id: string; username: string; display_name: string; avatar_path: string | null };

export default async function ConnectionsPage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ tip?: string }> }) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const kind = query.tip === "following" ? "following" : "followers";
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, display_name").eq("username", username).single();
  if (!profile) notFound();
  const { data } = await supabase.rpc("profile_connections", { target_user: profile.id, connection_kind: kind });
  const connections = (data ?? []) as Connection[];
  const avatars = await Promise.all(connections.map((item) => item.avatar_path ? supabase.storage.from("avatars").createSignedUrl(item.avatar_path, 3600) : Promise.resolve({ data: null })));

  return <><Link href={`/profil/${username}`} className="text-sm font-semibold text-violet-300">← Înapoi la profil</Link><p className="mt-7 text-sm font-semibold text-violet-300">{profile.display_name}</p><h1 className="mt-1 text-3xl font-black">{kind === "followers" ? "Urmăritori" : "Urmăriri"}</h1><div className="mt-7 space-y-2">{connections.map((item, index) => <Link href={`/profil/${item.username}`} key={item.user_id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 transition hover:bg-white/[.06]"><span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">{avatars[index].data?.signedUrl ? <img src={avatars[index].data.signedUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold">{item.display_name[0]?.toUpperCase()}</span>}</span><span className="min-w-0"><b className="block truncate">{item.display_name}</b><span className="block truncate text-sm text-[#918a9e]">@{item.username}</span></span></Link>)}{connections.length === 0 && <div className="card p-10 text-center text-[#918a9e]">Lista este goală momentan.</div>}</div></>;
}
