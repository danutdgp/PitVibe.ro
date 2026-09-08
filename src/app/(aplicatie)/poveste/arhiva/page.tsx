/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArchiveDeleteButton } from "@/components/archive-delete-button";

export const metadata = { title: "Arhiva stories" };

type ArchivedStory = { id: string; media_path: string; media_type: "image" | "video"; created_at: string; storage_bytes: number };

function formatBytes(bytes: number) { if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export default async function StoryArchivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: stories, error } = await supabase.from("stories").select("id, media_path, media_type, created_at, storage_bytes").eq("author_id", user.id).lte("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  const rows = (stories ?? []) as ArchivedStory[];
  const { data: urls } = rows.length ? await supabase.storage.from("story-media").createSignedUrls(rows.map((story) => story.media_path), 3600) : { data: [] };
  const urlMap = new Map((urls ?? []).map((item) => [item.path, item.signedUrl]));
  const totalBytes = rows.reduce((total, story) => total + Number(story.storage_bytes ?? 0), 0);

  return <><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-violet-300">Doar pentru tine</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Arhiva stories</h1><p className="mt-3 max-w-xl leading-7 text-[#aaa4b8]">Stories expirate păstrate fără copii duplicate ale fișierelor.</p></div><Link href="/poveste" className="button-secondary shrink-0">Story nou</Link></div><div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-sm"><span>{rows.length}/100 stories</span><span className="text-[#aaa4b8]">{formatBytes(totalBytes)} din 2 GB</span></div>{rows.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{rows.map((story) => { const url = urlMap.get(story.media_path); return <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-black" key={story.id}>{url && (story.media_type === "video" ? <video src={url} controls playsInline className="aspect-[9/16] w-full object-cover" /> : <img src={url} alt="Story arhivat" className="aspect-[9/16] w-full object-cover" />)}<div className="flex items-center justify-between gap-2 bg-[#171320] px-3 py-2"><div><time className="block text-xs text-white/70">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(new Date(story.created_at))}</time><span className="text-[11px] text-[#827b8e]">{formatBytes(story.storage_bytes)}</span></div><ArchiveDeleteButton storyId={story.id} /></div></article>; })}</div> : <div className="card mt-6 p-10 text-center"><p className="text-3xl">◌</p><h2 className="mt-3 text-xl font-bold">Arhiva este goală</h2><p className="mt-2 text-sm text-[#aaa4b8]">După 24 de ore, stories vor apărea aici.</p></div>}<p className="mt-6 text-xs leading-5 text-[#827b8e]">Fișierele nu sunt copiate. Pentru a elibera spațiu, șterge stories arhivate pe care nu le mai vrei.</p></>;
}
