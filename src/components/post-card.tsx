/* Signed, private Storage URLs are already resized at upload time. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { toggleLike, toggleSave } from "@/app/actions/social";
import { PostMediaGallery } from "@/components/post-media-gallery";
import type { FeedPost } from "@/lib/posts";

function HeartIcon({ filled }: { filled: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
}

function CommentIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-3.8-.8L3 21l1.7-5a8.5 8.5 0 1 1 16.3-4.5Z" /></svg>;
}

function relativeTime(date: string) {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("ro", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: string }) {
  return <article className="card overflow-hidden">
    <div className="flex items-center gap-3 p-5">
      <Link href={`/profil/${post.profile.username}`} className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
          {post.profile.avatar_url ? <img src={post.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold">{post.profile.display_name[0]?.toUpperCase()}</span>}
        </div>
        <div className="min-w-0"><p className="truncate font-bold">{post.profile.display_name}</p><p className="truncate text-xs text-[#8f899a]">@{post.profile.username} · {relativeTime(post.created_at)}</p></div>
      </Link>
      {post.author_id === currentUserId && <Link href={`/postare/${post.id}/editeaza`} className="ml-auto rounded-full px-3 py-2 text-sm text-[#aaa4b8] hover:bg-white/5">Editează</Link>}
    </div>
    {post.content && <p className="whitespace-pre-wrap px-5 pb-5 leading-7 text-[#e8e3ef]">{post.content}</p>}
    {post.media.length > 0 && <PostMediaGallery media={post.media} authorName={post.profile.display_name} />}
    <div className="flex items-center gap-1 border-t border-white/7 px-3 py-2">
      <form action={toggleLike}>
        <input type="hidden" name="post_id" value={post.id} />
        <button aria-label={post.liked ? "Retrage aprecierea" : "Apreciază"} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5 ${post.liked ? "text-fuchsia-300" : "text-[#aaa4b8]"}`}><HeartIcon filled={post.liked} />{post.like_count || ""}</button>
      </form>
      <Link href={`/postare/${post.id}#comentarii`} aria-label="Vezi comentariile" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[#aaa4b8] transition-colors hover:bg-white/5 hover:text-violet-200"><CommentIcon />{post.comment_count || ""}</Link>
      {post.author_id !== currentUserId && <Link aria-label="Raportează postarea" href={`/raporteaza/post/${post.id}?return=/postare/${post.id}`} className="rounded-full px-2 py-2 text-xs text-[#777181]">Raportează</Link>}
      <form action={toggleSave} className="ml-auto"><input type="hidden" name="post_id" value={post.id} /><button aria-label={post.saved ? "Elimină din salvate" : "Salvează postarea"} className={`rounded-full px-3 py-2 text-sm hover:bg-white/5 ${post.saved ? "text-violet-300" : "text-[#aaa4b8]"}`}>{post.saved ? "◆" : "◇"}</button></form>
    </div>
  </article>;
}
