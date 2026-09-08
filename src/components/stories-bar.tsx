"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryGroup } from "@/lib/stories";
import { EmojiTextField } from "@/components/emoji-text-field";

type StoryViewer = { id: string; username: string; displayName: string; viewedAt: string };

export function StoriesBar({ groups: initialGroups, currentUserId, showCreate = true, autoOpen = false, showBar = true }: { groups: StoryGroup[]; currentUserId: string; showCreate?: boolean; autoOpen?: boolean; showBar?: boolean }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [groupIndex, setGroupIndex] = useState<number | null>(autoOpen ? 0 : null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");
  const progressRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const swipeStartY = useRef<number | null>(null);
  const group = groupIndex === null ? null : groups[groupIndex];
  const story = group?.stories[storyIndex];
  const activeStoryId = story?.id;
  const activeAuthorId = group?.authorId;
  const activeMediaType = story?.mediaType;

  const storyPaused = replyFocused || reply.length > 0;

  function close() { setGroupIndex(null); setStoryIndex(0); setProgress(0); setViewersOpen(false); setReply(""); setReplyFocused(false); setReplyStatus(""); }
  function next() {
    if (!group || groupIndex === null) return;
    setProgress(0);
    if (storyIndex < group.stories.length - 1) { setStoryIndex(storyIndex + 1); return; }
    if (groupIndex < groups.length - 1) { setGroupIndex(groupIndex + 1); setStoryIndex(0); return; }
    close();
  }
  function previous() {
    if (!group || groupIndex === null) return;
    setProgress(0);
    if (storyIndex > 0) { setStoryIndex(storyIndex - 1); return; }
    if (groupIndex > 0) { const previousGroup = groups[groupIndex - 1]; setGroupIndex(groupIndex - 1); setStoryIndex(previousGroup.stories.length - 1); }
  }

  function handleSwipeStart(event: React.PointerEvent<HTMLDivElement>) { swipeStartY.current = event.clientY; }
  function handleSwipeEnd(event: React.PointerEvent<HTMLDivElement>) { if (swipeStartY.current !== null && Math.abs(event.clientY - swipeStartY.current) > 80) close(); swipeStartY.current = null; }

  useEffect(() => {
    if (!activeStoryId || !activeAuthorId || activeAuthorId === currentUserId) return;
    void fetch(`/api/stories/${activeStoryId}/view`, { method: "POST" });
  }, [activeStoryId, activeAuthorId, currentUserId]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!activeStoryId || activeMediaType === "video" || storyPaused) return;
    const startedAt = Date.now() - (progressRef.current / 100) * 5000;
    const interval = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - startedAt) / 5000) * 100)), 50);
    const timeout = window.setTimeout(next, 5000);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
    // `next` intentionally follows the story currently displayed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId, activeMediaType, storyPaused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeMediaType !== "video") return;
    if (storyPaused) video.pause(); else void video.play();
  }, [activeStoryId, activeMediaType, storyPaused]);

  useEffect(() => {
    if (!story) return;
    const oldOverflow = document.body.style.overflow;
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowRight") next(); if (event.key === "ArrowLeft") previous(); };
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", keydown); };
    // Keyboard controls always act on the currently displayed story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId]);

  async function removeStory() {
    if (!story || !window.confirm("Ștergi definitiv acest story?")) return;
    const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setGroups((current) => current.map((item) => ({ ...item, stories: item.stories.filter((entry) => entry.id !== story.id) })).filter((item) => item.stories.length));
    close(); router.refresh();
  }

  async function openViewers() {
    if (!story) return;
    setViewersOpen(true); setViewersLoading(true);
    const response = await fetch(`/api/stories/${story.id}/viewers`);
    const result = await response.json().catch(() => null) as { viewers?: StoryViewer[] } | null;
    setViewers(result?.viewers ?? []); setViewersLoading(false);
  }

  async function toggleLike() {
    if (!story) return;
    const liked = story.liked;
    const response = await fetch(`/api/stories/${story.id}/like`, { method: liked ? "DELETE" : "POST" });
    if (!response.ok) return;
    setGroups((current) => current.map((item) => ({ ...item, stories: item.stories.map((entry) => entry.id === story.id ? { ...entry, liked: !liked, likeCount: entry.likeCount + (liked ? -1 : 1) } : entry) })));
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!story || !reply.trim() || replyBusy) return;
    setReplyBusy(true); setReplyStatus("");
    const response = await fetch(`/api/stories/${story.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: reply.trim() }) });
    setReplyBusy(false);
    if (!response.ok) { setReplyStatus("Răspunsul nu a putut fi trimis."); return; }
    setReply(""); setReplyStatus("Trimis");
  }

  return <>
    {showBar && <section aria-label="Stories" className="mt-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-4 px-1">
        {showCreate && <Link href="/poveste" className="group flex w-[72px] flex-col items-center gap-2 text-center">
          <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[.055]"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-2xl font-light transition group-hover:scale-110">+</span></span>
          <span className="w-full truncate text-xs text-[#c5bece]">Story nou</span>
        </Link>}
        {groups.map((item, index) => <button type="button" onClick={() => { setProgress(0); setGroupIndex(index); const unseen = item.stories.findIndex((entry) => !entry.viewed); setStoryIndex(unseen < 0 ? 0 : unseen); }} className="group flex w-[72px] flex-col items-center gap-2 text-center" key={item.authorId}>
          <span className={`rounded-full p-[2px] ${item.allViewed ? "bg-white/20" : "bg-gradient-to-tr from-fuchsia-500 via-violet-500 to-orange-300"}`}><span className="block h-[60px] w-[60px] overflow-hidden rounded-full border-[3px] border-[#0d0a13] bg-gradient-to-br from-violet-500 to-fuchsia-500">{item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-lg font-bold">{item.displayName[0]?.toUpperCase()}</span>}</span></span>
          <span className="w-full truncate text-xs text-[#c5bece]">{item.authorId === currentUserId ? "Story-ul tău" : item.displayName}</span>
        </button>)}
      </div>
    </section>}

    {story && group && <div role="dialog" aria-modal="true" aria-label={`Story de la ${group.displayName}`} onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 sm:p-5">
      <div className="relative h-full w-full overflow-hidden bg-black sm:h-[min(900px,95vh)] sm:max-w-lg sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()} onPointerDown={handleSwipeStart} onPointerUp={handleSwipeEnd}>
        <div className="absolute inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-30 flex gap-1">{group.stories.map((item, index) => { const value = index < storyIndex ? 100 : index === storyIndex ? progress : 0; return <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30 shadow-sm" key={item.id}><span className="block h-full origin-left rounded-full bg-white will-change-transform" style={{ transform: `scaleX(${value / 100})` }} /></span>; })}</div>
        <div className="absolute inset-x-4 top-[calc(max(.75rem,env(safe-area-inset-top))+1rem)] z-20 flex items-center gap-3 text-white"><Link href={`/profil/${group.username}`} onClick={close} className="flex min-w-0 items-center gap-2"><span className="h-9 w-9 overflow-hidden rounded-full bg-violet-600">{group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-bold">{group.displayName[0]?.toUpperCase()}</span>}</span><span className="truncate text-sm font-bold">{group.displayName}</span></Link><span className="text-xs text-white/65">{new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(new Date(story.createdAt))}</span><button type="button" onClick={close} aria-label="Închide" className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/25 text-2xl">×</button></div>
        {story.mediaType === "video" ? <video ref={videoRef} key={story.id} src={story.mediaUrl} autoPlay playsInline className="h-full w-full object-contain" onTimeUpdate={(event) => { const video = event.currentTarget; if (video.duration) setProgress((video.currentTime / video.duration) * 100); }} onEnded={next} /> : <img src={story.mediaUrl} alt={`Story de la ${group.displayName}`} className="h-full w-full object-contain" />}
        <button type="button" onClick={previous} aria-label="Story anterior" className="absolute inset-y-20 left-0 w-1/3 cursor-w-resize" />
        <button type="button" onClick={next} aria-label="Story următor" className="absolute inset-y-20 right-0 w-1/3 cursor-e-resize" />
        <button type="button" onClick={previous} aria-label="Story anterior" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/35 text-3xl font-light text-white/80 backdrop-blur-sm transition hover:bg-black/60 hover:text-white sm:grid">‹</button>
        <button type="button" onClick={next} aria-label="Story următor" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/35 text-3xl font-light text-white/80 backdrop-blur-sm transition hover:bg-black/60 hover:text-white sm:grid">›</button>
        {viewersOpen && group.authorId === currentUserId && <div className="absolute inset-x-4 bottom-20 z-40 max-h-[55%] overflow-y-auto rounded-2xl border border-white/10 bg-[#171320]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><h2 className="font-bold">Cine a văzut</h2><button type="button" onClick={() => setViewersOpen(false)} aria-label="Închide vizualizările" className="grid h-8 w-8 place-items-center rounded-full bg-white/[.08] text-lg">×</button></div>{viewersLoading ? <p className="py-8 text-center text-sm text-white/60">Se încarcă...</p> : viewers.length ? <div className="mt-3 divide-y divide-white/8">{viewers.map((viewer) => <Link href={`/profil/${viewer.username}`} onClick={close} className="flex items-center gap-3 py-3" key={viewer.id}><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold">{viewer.displayName[0]?.toUpperCase()}</span><span><strong className="block text-sm">{viewer.displayName}</strong><span className="text-xs text-white/50">@{viewer.username}</span></span><time className="ml-auto text-xs text-white/45">{new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(new Date(viewer.viewedAt))}</time></Link>)}</div> : <p className="py-8 text-center text-sm text-white/60">Nicio vizualizare încă.</p>}</div>}
        <div className="absolute inset-x-4 bottom-5 z-20 flex items-end justify-between gap-3"><div className="flex items-center gap-2">{group.authorId === currentUserId ? <button type="button" onClick={openViewers} className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white">◉ {story.viewCount} vizualizări</button> : <button type="button" onClick={toggleLike} aria-label={story.liked ? "Elimină aprecierea" : "Apreciază story-ul"} className={`rounded-full px-4 py-2 text-sm font-semibold ${story.liked ? "bg-fuchsia-500 text-white" : "bg-black/55 text-white"}`}>♥ {story.likeCount}</button>}</div>{group.authorId === currentUserId ? <button type="button" onClick={removeStory} className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-red-200">Șterge</button> : <form onSubmit={sendReply} className="flex min-w-0 flex-1 items-center justify-end gap-2"><EmojiTextField name="reply" value={reply} onValueChange={setReply} onFocus={() => setReplyFocused(true)} onBlur={() => { if (!reply) setReplyFocused(false); }} maxLength={1000} placeholder="Răspunde..." className="min-w-0 flex-1 rounded-full border border-white/15 bg-black/55 px-4 py-2 pr-12 text-sm text-white placeholder:text-white/55" /><button type="submit" disabled={!reply.trim() || replyBusy} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{replyBusy ? "..." : "Trimite"}</button></form>}</div>
        {replyStatus && <p role="status" className="absolute bottom-20 right-4 z-30 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">{replyStatus}</p>}
      </div>
    </div>}
  </>;
}
