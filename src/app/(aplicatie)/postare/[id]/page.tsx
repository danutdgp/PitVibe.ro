import Link from "next/link";
import { notFound } from "next/navigation";
import { addComment, deleteComment } from "@/app/actions/social";
import { PostCard } from "@/components/post-card";
import { getPost } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

type CommentRecord = { id: string; content: string; created_at: string; author_id: string; parent_id: string | null; profiles: { username: string; display_name: string } | { username: string; display_name: string }[] | null };

function relatedRow<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

function CommentCard({ comment, replies, postId, userId, nested = false }: { comment: CommentRecord; replies?: CommentRecord[]; postId: string; userId: string; nested?: boolean }) {
  const author = relatedRow(comment.profiles);
  const own = comment.author_id === userId;
  return <article className={`rounded-2xl border border-white/8 p-4 ${nested ? "bg-white/[.025]" : "bg-white/[.035]"}`}>
    <div className="flex items-baseline justify-between gap-3"><Link href={`/profil/${author?.username ?? ""}`} className="text-sm font-bold">{author?.display_name ?? "Membru PitiVibe"}</Link><time className="text-xs text-[#777181]">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}</time></div>
    <p className="mt-2 whitespace-pre-wrap leading-6 text-[#d8d2df]">{comment.content}</p>
    <div className="mt-3 flex items-center gap-3 text-xs">
      {own ? <><Link className="text-violet-300" href={`/comentariu/${comment.id}/editeaza?post=${postId}`}>Editează</Link><form action={deleteComment}><input type="hidden" name="comment_id" value={comment.id} /><input type="hidden" name="post_id" value={postId} /><button className="text-red-300">Șterge</button></form></> : <Link className="text-red-300" href={`/raporteaza/comment/${comment.id}?return=/postare/${postId}`}>Raportează</Link>}
    </div>
    {!nested && <details className="group mt-3"><summary className="w-fit cursor-pointer list-none text-xs font-semibold text-violet-300">Răspunde</summary><form action={addComment} className="mt-3 flex gap-2"><input type="hidden" name="post_id" value={postId} /><input type="hidden" name="parent_id" value={comment.id} /><input className="field min-h-10 py-2 text-sm" name="comentariu" maxLength={1000} required placeholder={`Răspunde-i lui ${author?.display_name ?? "acestui membru"}…`} /><button className="button-primary min-h-10 shrink-0 px-4 text-sm">Trimite</button></form></details>}
    {replies?.length ? <div className="ml-3 mt-4 space-y-3 border-l border-violet-400/20 pl-3 sm:ml-6 sm:pl-4">{replies.map((reply) => <CommentCard key={reply.id} comment={reply} postId={postId} userId={userId} nested />)}</div> : null}
  </article>;
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, supabase] = await Promise.all([getPost(id), createClient()]);
  if (!post) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: comments } = await supabase.from("comments").select("id, content, created_at, author_id, parent_id, profiles!comments_author_id_fkey(username, display_name)").eq("post_id", id).order("created_at").limit(200);
  const allComments = (comments ?? []) as CommentRecord[];
  const roots = allComments.filter((comment) => !comment.parent_id);
  const replies = new Map<string, CommentRecord[]>();
  for (const comment of allComments) if (comment.parent_id) replies.set(comment.parent_id, [...(replies.get(comment.parent_id) ?? []), comment]);

  return <>
    <PostCard post={post} currentUserId={user!.id} />
    <section id="comentarii" className="mt-6">
      <h1 className="text-xl font-bold">Comentarii <span className="text-[#827b8e]">{post.comment_count}</span></h1>
      <form action={addComment} className="mt-4 flex gap-3"><input type="hidden" name="post_id" value={id} /><input className="field" name="comentariu" maxLength={1000} required placeholder="Scrie un comentariu…" aria-label="Comentariu" /><button className="button-primary shrink-0" type="submit">Trimite</button></form>
      <div className="mt-5 space-y-3">{roots.map((comment) => <CommentCard key={comment.id} comment={comment} replies={replies.get(comment.id)} postId={id} userId={user!.id} />)}{!roots.length && <p className="py-8 text-center text-[#827b8e]">Niciun comentariu încă.</p>}</div>
    </section>
  </>;
}
