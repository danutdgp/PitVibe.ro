import Link from "next/link";
import { AccountSuggestions } from "@/components/account-suggestions";
import { PostCard } from "@/components/post-card";
import { StoriesBar } from "@/components/stories-bar";
import { getFeed } from "@/lib/posts";
import { getStoryGroups } from "@/lib/stories";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Acasă" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ flux?: string; cursor?: string }> }) {
  const params = await searchParams;
  const scope = params.flux === "urmaresc" ? "urmaresc" : "pitesti";
  const [{ posts, nextCursor }, storyData, supabase] = await Promise.all([getFeed(scope, params.cursor), getStoryGroups(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  return <>
    <div><p className="text-sm font-semibold text-violet-300">Bun venit pe PitVibe.ro</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Ce mai e nou prin oraș?</h1></div>
    <StoriesBar groups={storyData.groups} currentUserId={storyData.currentUserId} />
    <AccountSuggestions />
    <div className="mt-7 flex gap-2 border-b border-white/8"><Link href="/acasa" className={`border-b-2 px-4 pb-3 text-sm font-bold ${scope === "pitesti" ? "border-violet-400 text-white" : "border-transparent text-[#827b8e]"}`}>Pitești</Link><Link href="/acasa?flux=urmaresc" className={`border-b-2 px-4 pb-3 text-sm font-bold ${scope === "urmaresc" ? "border-violet-400 text-white" : "border-transparent text-[#827b8e]"}`}>Urmăresc</Link></div>
    {posts.length ? <div className="mt-6 space-y-5">{posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user!.id} />)}{nextCursor && <Link className="button-secondary w-full" href={`/acasa?flux=${scope}&cursor=${encodeURIComponent(nextCursor)}`}>Mai multe postări</Link>}</div> : <section className="card mt-6 px-6 py-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-400/10 text-2xl">✦</div><h2 className="mt-5 text-xl font-bold">{scope === "urmaresc" ? "Feedul tău așteaptă oameni noi" : "Fii primul care publică"}</h2><p className="mx-auto mt-2 max-w-md leading-7 text-[#aaa4b8]">{scope === "urmaresc" ? "Urmărește persoane din comunitate pentru a le vedea postările aici." : "Împărtășește o poveste sau o fotografie din Pitești."}</p><Link className="button-primary mt-6" href={scope === "urmaresc" ? "/descopera" : "/publica"}>{scope === "urmaresc" ? "Descoperă oameni" : "Creează o postare"}</Link></section>}
  </>;
}
