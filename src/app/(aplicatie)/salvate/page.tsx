import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getFeed } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Postări salvate" };
export default async function SavedPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) { const params = await searchParams; const [{ posts, nextCursor }, supabase] = await Promise.all([getFeed("salvate", params.cursor), createClient()]); const { data: { user } } = await supabase.auth.getUser(); return <><p className="text-sm font-semibold text-violet-300">Doar pentru tine</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Postări salvate</h1>{posts.length ? <div className="mt-7 space-y-5">{posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user!.id} />)}{nextCursor && <Link className="button-secondary w-full" href={`/salvate?cursor=${encodeURIComponent(nextCursor)}`}>Mai multe</Link>}</div> : <div className="card mt-7 p-10 text-center"><p className="text-2xl">◇</p><h2 className="mt-3 font-bold">Nu ai salvat nimic încă</h2><p className="mt-2 text-sm text-[#918a9e]">Postările salvate sunt private și apar numai aici.</p><Link className="button-primary mt-6" href="/acasa">Vezi feedul</Link></div>}</>; }
